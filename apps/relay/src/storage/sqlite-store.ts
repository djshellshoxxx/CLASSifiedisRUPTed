/**
 * F15.S02.M03 storage: durable DataStore on node:sqlite (synchronous, WAL).
 * The relay process is the single writer, so a decoded write-through cache per collection
 * gives memory-speed reads; the cache is dropped on rollback and reloaded from disk.
 */
import { DatabaseSync } from 'node:sqlite';
import type { Collection, DataStore, DomainEvent, EventLog, IdempotencyRecord, IdempotencyStore, NewRecord, StoredEvent, Versioned } from '@classrup/kernel';
import { assertCollectionName, collectionCode, conflict, decodeJson, deepFreeze, encodeJson, notFound } from '@classrup/kernel';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (collection, id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS events (
  position INTEGER PRIMARY KEY AUTOINCREMENT,
  aggregate_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_aggregate ON events (aggregate_id);
CREATE TABLE IF NOT EXISTS idempotency (
  key TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  response TEXT NOT NULL,
  expires_at INTEGER NOT NULL
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
`;

export const SCHEMA_VERSION = 1;

type Row = Record<string, unknown>;

class SqliteCollection<T extends Versioned> implements Collection<T> {
  constructor(
    private readonly store: SqliteDataStore,
    private readonly name: string,
  ) {}

  get(id: string): T | undefined {
    return this.store.cacheFor(this.name).get(id) as T | undefined;
  }

  require(id: string): T {
    const r = this.get(id);
    if (!r) throw notFound(`${collectionCode(this.name)}.NOT_FOUND`, `${this.name} not found`, { id });
    return r;
  }

  put(record: NewRecord<T> | T, expectedVersion: number): T {
    return this.store.transaction(() => {
      const cache = this.store.cacheFor(this.name);
      const currentVersion = cache.get(record.id)?.version ?? 0;
      if (currentVersion !== expectedVersion) {
        throw conflict('STORE.VERSION_CONFLICT', `${this.name} changed concurrently`, { id: record.id, expected: expectedVersion, actual: currentVersion });
      }
      const stored = deepFreeze(structuredClone({ ...record, version: expectedVersion + 1 })) as T;
      this.store.stmt('upsert').run(this.name, record.id, stored.version, encodeJson(stored));
      cache.set(record.id, stored);
      return stored;
    });
  }

  delete(id: string, expectedVersion: number): void {
    this.store.transaction(() => {
      const cache = this.store.cacheFor(this.name);
      const current = cache.get(id);
      if (!current) throw notFound(`${collectionCode(this.name)}.NOT_FOUND`, `${this.name} not found`, { id });
      if (current.version !== expectedVersion) {
        throw conflict('STORE.VERSION_CONFLICT', `${this.name} changed concurrently`, { id, expected: expectedVersion, actual: current.version });
      }
      this.store.stmt('deleteRecord').run(this.name, id);
      cache.delete(id);
    });
  }

  list(filter?: (record: T) => boolean): T[] {
    const all = [...this.store.cacheFor(this.name).values()] as T[];
    return filter ? all.filter(filter) : all;
  }

  count(filter?: (record: T) => boolean): number {
    return filter ? this.list(filter).length : this.store.cacheFor(this.name).size;
  }
}

export class SqliteDataStore implements DataStore {
  readonly #db: DatabaseSync;
  readonly #stmts = new Map<string, ReturnType<DatabaseSync['prepare']>>();
  readonly #collections = new Map<string, SqliteCollection<Versioned>>();
  #cache = new Map<string, Map<string, Versioned>>();
  #depth = 0;
  #afterCommit: (() => void)[] = [];

  constructor(path: string) {
    this.#db = new DatabaseSync(path);
    this.#db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
    this.#db.exec(SCHEMA);
    const row = this.#db.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get() as Row | undefined;
    if (!row) this.#db.prepare(`INSERT INTO meta (key, value) VALUES ('schema_version', ?)`).run(String(SCHEMA_VERSION));
    else if (Number(row.value) > SCHEMA_VERSION) throw new Error(`database schema ${String(row.value)} is newer than supported ${SCHEMA_VERSION}`);
  }

  stmt(name: 'upsert' | 'deleteRecord' | 'loadCollection' | 'appendEvent' | 'readEvents' | 'byAggregate' | 'lastPosition' | 'idemGet' | 'idemPut' | 'idemPurge' | 'collections'): ReturnType<DatabaseSync['prepare']> {
    let s = this.#stmts.get(name);
    if (!s) {
      const sql: Record<typeof name, string> = {
        upsert: 'INSERT INTO records (collection, id, version, data) VALUES (?, ?, ?, ?) ON CONFLICT(collection, id) DO UPDATE SET version = excluded.version, data = excluded.data',
        deleteRecord: 'DELETE FROM records WHERE collection = ? AND id = ?',
        loadCollection: 'SELECT data FROM records WHERE collection = ?',
        appendEvent: 'INSERT INTO events (aggregate_id, type, data) VALUES (?, ?, ?)',
        readEvents: 'SELECT position, data FROM events WHERE position > ? ORDER BY position LIMIT ?',
        byAggregate: 'SELECT data FROM events WHERE aggregate_id = ? ORDER BY position',
        lastPosition: 'SELECT COALESCE(MAX(position), 0) AS p FROM events',
        idemGet: 'SELECT key, fingerprint, response, expires_at FROM idempotency WHERE key = ? AND expires_at > ?',
        idemPut: 'INSERT OR REPLACE INTO idempotency (key, fingerprint, response, expires_at) VALUES (?, ?, ?, ?)',
        idemPurge: 'DELETE FROM idempotency WHERE expires_at <= ?',
        collections: 'SELECT DISTINCT collection FROM records',
      };
      s = this.#db.prepare(sql[name]);
      this.#stmts.set(name, s);
    }
    return s;
  }

  cacheFor(name: string): Map<string, Versioned> {
    let m = this.#cache.get(name);
    if (!m) {
      m = new Map();
      for (const row of this.stmt('loadCollection').all(name) as Row[]) {
        const rec = deepFreeze(decodeJson<Versioned>(String(row.data)));
        m.set(rec.id, rec);
      }
      this.#cache.set(name, m);
    }
    return m;
  }

  collection<T extends Versioned>(name: string): Collection<T> {
    assertCollectionName(name);
    let c = this.#collections.get(name);
    if (!c) {
      c = new SqliteCollection<Versioned>(this, name);
      this.#collections.set(name, c);
    }
    return c as unknown as Collection<T>;
  }

  readonly events: EventLog = {
    append: (events: readonly DomainEvent[]) => {
      this.transaction(() => {
        for (const e of events) this.stmt('appendEvent').run(e.aggregateId, e.type, encodeJson(e));
      });
    },
    read: (from = 0, limit = 1000): StoredEvent[] =>
      (this.stmt('readEvents').all(from, limit) as Row[]).map((r) => ({ position: Number(r.position), event: decodeJson<DomainEvent>(String(r.data)) })),
    byAggregate: (id: string) => (this.stmt('byAggregate').all(id) as Row[]).map((r) => decodeJson<DomainEvent>(String(r.data))),
    lastPosition: () => Number((this.stmt('lastPosition').get() as Row).p),
  };

  readonly idempotency: IdempotencyStore = {
    get: (key: string, now: number): IdempotencyRecord | undefined => {
      const r = this.stmt('idemGet').get(key, now) as Row | undefined;
      return r ? { key: String(r.key), fingerprint: String(r.fingerprint), response: decodeJson(String(r.response)), expiresAt: Number(r.expires_at) } : undefined;
    },
    put: (rec: IdempotencyRecord) => {
      this.transaction(() => this.stmt('idemPut').run(rec.key, rec.fingerprint, encodeJson(rec.response), rec.expiresAt));
    },
    purgeExpired: (now: number) => Number(this.stmt('idemPurge').run(now).changes),
  };

  transaction<R>(fn: () => R): R {
    if (this.#depth > 0) return fn();
    this.#db.exec('BEGIN IMMEDIATE');
    this.#depth++;
    let result: R;
    try {
      result = fn();
      if (result instanceof Promise) throw new TypeError('transactions must be synchronous');
      this.#db.exec('COMMIT');
    } catch (e) {
      this.#db.exec('ROLLBACK');
      // Cached records may include writes from the rolled-back transaction.
      this.#cache = new Map();
      this.#afterCommit = [];
      throw e;
    } finally {
      this.#depth--;
    }
    const callbacks = this.#afterCommit;
    this.#afterCommit = [];
    for (const cb of callbacks) cb();
    return result;
  }

  afterCommit(fn: () => void): void {
    if (this.#depth > 0) this.#afterCommit.push(fn);
    else fn();
  }

  exportSnapshot(): { collections: Record<string, Versioned[]>; events: StoredEvent[] } {
    const collections: Record<string, Versioned[]> = {};
    for (const row of this.stmt('collections').all() as Row[]) {
      const name = String(row.collection);
      collections[name] = [...this.cacheFor(name).values()];
    }
    const events: StoredEvent[] = [];
    for (let from = 0; ; ) {
      const page = this.events.read(from, 5000);
      if (page.length === 0) break;
      events.push(...page);
      from = (page[page.length - 1] as StoredEvent).position;
    }
    return { collections, events };
  }

  close(): void {
    this.#db.close();
  }
}
