/**
 * Persistence ports (owner F15.S02.M03 storage). Synchronous by design: the relay uses
 * node:sqlite (synchronous) and tests use the in-memory adapter, so a command runs as one
 * uninterrupted transaction with optimistic concurrency on record versions.
 */
import type { DomainEvent } from './events';
import { conflict, notFound } from './errors';
import { deepFreeze } from './json';

export interface Versioned {
  readonly id: string;
  /** Monotonic record version; 1 after first insert. */
  readonly version: number;
}

export type NewRecord<T extends Versioned> = Omit<T, 'version'>;

export interface Collection<T extends Versioned> {
  get(id: string): T | undefined;
  /** Like get but throws `<NAME>.NOT_FOUND`. */
  require(id: string): T;
  /**
   * Insert (expectedVersion 0) or update (expectedVersion = current version).
   * Returns the stored, frozen record with version = expectedVersion + 1.
   * Throws STORE.VERSION_CONFLICT on mismatch.
   */
  put(record: NewRecord<T> | T, expectedVersion: number): T;
  delete(id: string, expectedVersion: number): void;
  list(filter?: (record: T) => boolean): T[];
  count(filter?: (record: T) => boolean): number;
}

export interface StoredEvent {
  readonly position: number;
  readonly event: DomainEvent;
}

/** Append-only event log / transactional outbox. Positions are dense and start at 1. */
export interface EventLog {
  append(events: readonly DomainEvent[]): void;
  read(fromPositionExclusive?: number, limit?: number): StoredEvent[];
  byAggregate(aggregateId: string): DomainEvent[];
  lastPosition(): number;
}

export interface IdempotencyRecord {
  readonly key: string;
  readonly fingerprint: string;
  readonly response: unknown;
  readonly expiresAt: number;
}

export interface IdempotencyStore {
  get(key: string, now: number): IdempotencyRecord | undefined;
  put(record: IdempotencyRecord): void;
  purgeExpired(now: number): number;
}

export interface DataStore {
  collection<T extends Versioned>(name: string): Collection<T>;
  readonly events: EventLog;
  readonly idempotency: IdempotencyStore;
  /** Run fn atomically. Nested calls join the outer transaction. Any throw rolls back everything. */
  transaction<R>(fn: () => R): R;
  /**
   * Run fn after the outermost transaction commits (immediately when none is open).
   * Callbacks registered in a transaction that rolls back are discarded.
   */
  afterCommit(fn: () => void): void;
}

const COLLECTION_RE = /^[a-z][a-z0-9_]{0,62}$/;

export function assertCollectionName(name: string): void {
  if (!COLLECTION_RE.test(name)) throw new TypeError(`invalid collection name: ${name}`);
}

export const collectionCode = (name: string): string => name.toUpperCase();

interface MemState {
  collections: Map<string, Map<string, Versioned>>;
  events: StoredEvent[];
  idem: Map<string, IdempotencyRecord>;
}

function cloneState(s: MemState): MemState {
  // Records are frozen, so a shallow map copy is a correct snapshot.
  const collections = new Map<string, Map<string, Versioned>>();
  for (const [k, v] of s.collections) collections.set(k, new Map(v));
  return { collections, events: [...s.events], idem: new Map(s.idem) };
}

class MemCollection<T extends Versioned> implements Collection<T> {
  constructor(
    private readonly store: InMemoryDataStore,
    private readonly name: string,
  ) {}

  private map(): Map<string, Versioned> {
    return this.store.mapFor(this.name);
  }

  get(id: string): T | undefined {
    return this.map().get(id) as T | undefined;
  }

  require(id: string): T {
    const r = this.get(id);
    if (!r) throw notFound(`${collectionCode(this.name)}.NOT_FOUND`, `${this.name} not found`, { id });
    return r;
  }

  put(record: NewRecord<T> | T, expectedVersion: number): T {
    return this.store.transaction(() => {
      const m = this.map();
      const current = m.get(record.id);
      const currentVersion = current?.version ?? 0;
      if (currentVersion !== expectedVersion) {
        throw conflict('STORE.VERSION_CONFLICT', `${this.name} changed concurrently`, {
          id: record.id,
          expected: expectedVersion,
          actual: currentVersion,
        });
      }
      const stored = deepFreeze(structuredClone({ ...record, version: expectedVersion + 1 })) as T;
      m.set(record.id, stored);
      return stored;
    });
  }

  delete(id: string, expectedVersion: number): void {
    this.store.transaction(() => {
      const m = this.map();
      const current = m.get(id);
      if (!current) throw notFound(`${collectionCode(this.name)}.NOT_FOUND`, `${this.name} not found`, { id });
      if (current.version !== expectedVersion) {
        throw conflict('STORE.VERSION_CONFLICT', `${this.name} changed concurrently`, { id, expected: expectedVersion, actual: current.version });
      }
      m.delete(id);
    });
  }

  list(filter?: (record: T) => boolean): T[] {
    const all = [...this.map().values()] as T[];
    return filter ? all.filter(filter) : all;
  }

  count(filter?: (record: T) => boolean): number {
    return this.list(filter).length;
  }
}

export class InMemoryDataStore implements DataStore {
  #state: MemState = { collections: new Map(), events: [], idem: new Map() };
  #txDepth = 0;
  readonly #collections = new Map<string, MemCollection<Versioned>>();

  mapFor(name: string): Map<string, Versioned> {
    let m = this.#state.collections.get(name);
    if (!m) {
      m = new Map();
      this.#state.collections.set(name, m);
    }
    return m;
  }

  collection<T extends Versioned>(name: string): Collection<T> {
    assertCollectionName(name);
    let c = this.#collections.get(name);
    if (!c) {
      c = new MemCollection<Versioned>(this, name);
      this.#collections.set(name, c);
    }
    return c as unknown as Collection<T>;
  }

  readonly events: EventLog = {
    append: (events) => {
      this.transaction(() => {
        for (const event of events) {
          this.#state.events.push({ position: this.#state.events.length + 1, event: deepFreeze(structuredClone(event)) });
        }
      });
    },
    read: (from = 0, limit = Number.MAX_SAFE_INTEGER) => this.#state.events.slice(from, from + limit),
    byAggregate: (id) => this.#state.events.filter((e) => e.event.aggregateId === id).map((e) => e.event),
    lastPosition: () => this.#state.events.length,
  };

  readonly idempotency: IdempotencyStore = {
    get: (key, now) => {
      const r = this.#state.idem.get(key);
      return r && r.expiresAt > now ? r : undefined;
    },
    put: (record) => {
      this.transaction(() => {
        this.#state.idem.set(record.key, deepFreeze(structuredClone(record)));
      });
    },
    purgeExpired: (now) => {
      let n = 0;
      for (const [k, r] of this.#state.idem) {
        if (r.expiresAt <= now) {
          this.#state.idem.delete(k);
          n++;
        }
      }
      return n;
    },
  };

  #afterCommit: (() => void)[] = [];

  transaction<R>(fn: () => R): R {
    if (this.#txDepth > 0) return fn();
    const snapshot = cloneState(this.#state);
    this.#txDepth++;
    let result: R;
    try {
      result = fn();
      if (result instanceof Promise) throw new TypeError('transactions must be synchronous');
    } catch (e) {
      this.#state = snapshot;
      this.#afterCommit = [];
      throw e;
    } finally {
      this.#txDepth--;
    }
    const callbacks = this.#afterCommit;
    this.#afterCommit = [];
    for (const cb of callbacks) cb();
    return result;
  }

  afterCommit(fn: () => void): void {
    if (this.#txDepth > 0) this.#afterCommit.push(fn);
    else fn();
  }

  /** Full snapshot for backups/tests (F15.S03.M02). */
  exportSnapshot(): { collections: Record<string, Versioned[]>; events: StoredEvent[] } {
    const collections: Record<string, Versioned[]> = {};
    for (const [k, v] of this.#state.collections) collections[k] = [...v.values()];
    return { collections, events: [...this.#state.events] };
  }
}
