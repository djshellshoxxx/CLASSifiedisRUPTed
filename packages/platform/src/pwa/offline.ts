/**
 * F15.S01.M01 offline write queue (ADR-0009). Writes made while offline are stored locally and stay
 * `pending` until the relay acknowledges them; nothing is ever shown as done before that.
 *
 * Ordering: items of the same `aggregateKey` are strictly FIFO and never in flight together; a head item
 * that ended in `conflict` or `failed_permanent` blocks its aggregate until the user retries, revises or
 * discards it, so later edits are never applied on top of a lost earlier one.
 * Safety: every item keeps one idempotency key for all retries, so a resend after a crash or lost
 * response is replayed by the relay instead of executed twice. A 409 conflict is surfaced to the user
 * and never retried automatically with the same input.
 */
import type { Clock, ErrorCategory, IdGenerator } from '@classrup/kernel';
import { canonicalize, conflict, precondition, unavailable, validationError } from '@classrup/kernel';

export type QueueStatus = 'pending' | 'sending' | 'acked' | 'failed_permanent' | 'conflict';
export type OfflineUxState = 'online' | 'offline' | 'syncing' | 'needs_attention';

export interface QueueError {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly message: string;
}

export interface QueueItem {
  readonly id: string;
  /** Enqueue order; survives reloads and defines FIFO within an aggregate. */
  readonly seq: number;
  readonly op: string;
  readonly input: unknown;
  readonly idempotencyKey: string;
  readonly aggregateKey: string;
  readonly status: QueueStatus;
  readonly attempts: number;
  readonly nextAttemptAt: number;
  readonly createdAt: number;
  readonly lastError?: QueueError;
  readonly ackedAt?: number;
  readonly response?: unknown;
}

/** Durable storage. The PWA backs it with IndexedDB; the default keeps items in memory. */
export interface QueueStorage {
  load(): Promise<readonly QueueItem[]>;
  save(items: readonly QueueItem[]): Promise<void>;
}

export class MemoryQueueStorage implements QueueStorage {
  #items: readonly QueueItem[] = [];
  load(): Promise<readonly QueueItem[]> {
    return Promise.resolve(structuredClone(this.#items));
  }
  save(items: readonly QueueItem[]): Promise<void> {
    this.#items = structuredClone(items);
    return Promise.resolve();
  }
}

export interface SendRequest {
  readonly op: string;
  readonly input: unknown;
  readonly idempotencyKey: string;
}

export type SendResult =
  | { readonly ok: true; readonly response?: unknown }
  | { readonly ok: false; readonly error: QueueError; readonly retryAfterMs?: number };

/** Transport. A thrown error or rejected promise is treated as a network failure and retried. */
export type Sender = (request: SendRequest) => Promise<SendResult>;

export interface OfflineQueueOptions {
  readonly storage: QueueStorage;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  /** Uniform random in [0, 1) for retry jitter. */
  readonly random: () => number;
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly maxItems?: number;
}

export interface EnqueueInput {
  readonly op: string;
  readonly input: unknown;
  readonly aggregateKey: string;
  /** Supply to make a repeated user action collapse into one item; generated otherwise. */
  readonly idempotencyKey?: string;
}

export interface QueueStats {
  readonly pending: number;
  readonly sending: number;
  readonly conflict: number;
  readonly failed: number;
  readonly acked: number;
  readonly authRequired: boolean;
  readonly persistenceFailed: boolean;
}

export interface FlushSummary {
  readonly attempted: number;
  readonly acked: number;
  readonly retryScheduled: number;
  readonly conflicts: number;
  readonly failed: number;
  readonly authRequired: boolean;
  /** Earliest time a scheduled retry becomes due, if any. */
  readonly nextAttemptAt?: number;
}

export const MAX_ATTEMPTS = 8;
const OP_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/;
const NETWORK_ERROR: QueueError = { code: 'OFFLINE.NETWORK', category: 'unavailable', message: 'network request failed' };

/** Exponential backoff with full jitter: uniform in [0, min(cap, base * 2^(attempt-1))]. */
export function backoffDelay(attempt: number, random: () => number, baseMs = 1000, capMs = 300_000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(random() * ceiling);
}

type Outcome = { readonly kind: 'acked' | 'conflict' | 'failed' | 'retry' | 'auth' };

export class OfflineQueue {
  readonly #o: Required<Omit<OfflineQueueOptions, 'storage' | 'clock' | 'ids' | 'random'>> & Pick<OfflineQueueOptions, 'storage' | 'clock' | 'ids' | 'random'>;
  #items: readonly QueueItem[] = [];
  #ready: Promise<void> | undefined;
  #lock: Promise<unknown> = Promise.resolve();
  #flight: Promise<FlushSummary> | undefined;
  #authRequired = false;
  #persistenceFailed = false;

  constructor(opts: OfflineQueueOptions) {
    this.#o = { maxAttempts: MAX_ATTEMPTS, baseDelayMs: 1000, maxDelayMs: 300_000, maxItems: 500, ...opts };
  }

  /** Loads persisted items. Items caught `sending` by a crash go back to `pending`; their key makes the resend safe. */
  load(): Promise<void> {
    this.#ready ??= this.#o.storage.load().then(async (stored) => {
      this.#items = stored.map((i) => (i.status === 'sending' ? { ...i, status: 'pending' as const } : i));
      if (this.#items.some((i, n) => i !== stored[n])) await this.#o.storage.save(this.#items);
    });
    return this.#ready;
  }

  async list(): Promise<readonly QueueItem[]> {
    await this.load();
    return [...this.#items].sort((a, b) => a.seq - b.seq);
  }

  async stats(): Promise<QueueStats> {
    await this.load();
    const count = (s: QueueStatus): number => this.#items.filter((i) => i.status === s).length;
    return {
      pending: count('pending'),
      sending: count('sending'),
      conflict: count('conflict'),
      failed: count('failed_permanent'),
      acked: count('acked'),
      authRequired: this.#authRequired,
      persistenceFailed: this.#persistenceFailed,
    };
  }

  async uxState(online: boolean): Promise<OfflineUxState> {
    const s = await this.stats();
    if (s.conflict + s.failed > 0 || s.authRequired || s.persistenceFailed) return 'needs_attention';
    if (!online) return 'offline';
    return s.pending + s.sending > 0 || this.#flight !== undefined ? 'syncing' : 'online';
  }

  async enqueue(input: EnqueueInput): Promise<QueueItem> {
    await this.load();
    if (!OP_RE.test(input.op)) throw validationError('OFFLINE.INVALID_OP', 'invalid operation name');
    if (input.aggregateKey.length < 1 || input.aggregateKey.length > 200) throw validationError('OFFLINE.INVALID_AGGREGATE', 'aggregateKey must be 1-200 characters');
    try {
      canonicalize(input.input);
    } catch {
      throw validationError('OFFLINE.INPUT_NOT_JSON', 'input must be plain JSON');
    }
    let created: QueueItem | undefined;
    await this.#mutate((items) => {
      const duplicate = input.idempotencyKey === undefined ? undefined : items.find((i) => i.idempotencyKey === input.idempotencyKey);
      if (duplicate) {
        created = duplicate;
        return items;
      }
      if (items.filter((i) => i.status !== 'acked').length >= this.#o.maxItems) throw precondition('OFFLINE.QUEUE_FULL', 'too many unsent changes', { max: this.#o.maxItems });
      const now = this.#o.clock.now();
      created = {
        id: this.#o.ids.next('oq'),
        seq: items.reduce((m, i) => Math.max(m, i.seq), 0) + 1,
        op: input.op,
        input: structuredClone(input.input),
        idempotencyKey: input.idempotencyKey ?? `ik_${this.#o.ids.ulid()}`,
        aggregateKey: input.aggregateKey,
        status: 'pending',
        attempts: 0,
        nextAttemptAt: now,
        createdAt: now,
      };
      return [...items, created];
    }, true);
    return created as QueueItem;
  }

  /** Sends every due head-of-aggregate item once. Concurrent calls share one run. */
  flush(sender: Sender): Promise<FlushSummary> {
    this.#flight ??= this.#run(sender).finally(() => {
      this.#flight = undefined;
    });
    return this.#flight;
  }

  /** Same input, same idempotency key: for a failed item the user wants to resend as it was. */
  async retry(id: string): Promise<void> {
    await this.#resolve(id, ['failed_permanent', 'conflict'], (i) => ({ ...i, status: 'pending', attempts: 0, nextAttemptAt: this.#o.clock.now() }));
  }

  /** New input needs a new idempotency key: the relay would reject the old key with a different payload. */
  async revise(id: string, input: unknown): Promise<void> {
    canonicalize(input);
    await this.#resolve(id, ['failed_permanent', 'conflict', 'pending'], (i) => ({
      ...i,
      input: structuredClone(input),
      idempotencyKey: `ik_${this.#o.ids.ulid()}`,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: this.#o.clock.now(),
    }));
  }

  /** Drops an unsent change the user no longer wants. A change already acknowledged cannot be discarded. */
  async discard(id: string): Promise<void> {
    await this.load();
    const item = this.#items.find((i) => i.id === id);
    if (!item || item.status === 'acked' || item.status === 'sending') throw conflict('OFFLINE.NOT_DISCARDABLE', 'item cannot be discarded now', { id });
    await this.#mutate((items) => items.filter((i) => i.id !== id), false);
  }

  /** Call after the user signed in again; flushing resumes. */
  resumeAfterAuth(): void {
    this.#authRequired = false;
  }

  async purgeAcked(): Promise<number> {
    await this.load();
    const before = this.#items.length;
    await this.#mutate((items) => items.filter((i) => i.status !== 'acked'), false);
    return before - this.#items.length;
  }

  /** Logout: unsent private changes must not stay on a shared device. */
  async clear(): Promise<void> {
    await this.load();
    await this.#mutate(() => [], false);
    this.#authRequired = false;
  }

  async #resolve(id: string, from: readonly QueueStatus[], change: (i: QueueItem) => QueueItem): Promise<void> {
    await this.load();
    const item = this.#items.find((i) => i.id === id);
    if (!item || !from.includes(item.status)) throw conflict('OFFLINE.INVALID_STATE', 'item is not in a state that allows this', { id });
    await this.#mutate((items) => items.map((i) => (i.id === id ? change(i) : i)), false);
  }

  /** Eligible = head of its aggregate (lowest seq not acked), pending, due, and not yet tried in this run. */
  #eligible(now: number, tried: ReadonlySet<string>): QueueItem[] {
    const heads = new Map<string, QueueItem>();
    for (const i of [...this.#items].sort((a, b) => a.seq - b.seq)) {
      if (i.status !== 'acked' && !heads.has(i.aggregateKey)) heads.set(i.aggregateKey, i);
    }
    return [...heads.values()].filter((i) => i.status === 'pending' && i.nextAttemptAt <= now && !tried.has(i.id));
  }

  async #run(sender: Sender): Promise<FlushSummary> {
    await this.load();
    const tally = { attempted: 0, acked: 0, retryScheduled: 0, conflicts: 0, failed: 0 };
    const tried = new Set<string>();
    for (let batch = this.#eligible(this.#o.clock.now(), tried); batch.length > 0 && !this.#authRequired; batch = this.#eligible(this.#o.clock.now(), tried)) {
      const ids = new Set(batch.map((i) => i.id));
      // Persist `sending` first: a crash mid-request leaves the item resendable under the same key.
      await this.#mutate((items) => items.map((i) => (ids.has(i.id) ? { ...i, status: 'sending' as const } : i)), false);
      const outcomes = await Promise.all(batch.map((i) => this.#sendOne(i, sender)));
      for (const i of batch) tried.add(i.id);
      tally.attempted += batch.length;
      for (const o of outcomes) {
        if (o.kind === 'acked') tally.acked++;
        else if (o.kind === 'retry') tally.retryScheduled++;
        else if (o.kind === 'conflict') tally.conflicts++;
        else if (o.kind === 'failed') tally.failed++;
      }
    }
    const due = this.#items.filter((i) => i.status === 'pending' && i.nextAttemptAt > this.#o.clock.now()).map((i) => i.nextAttemptAt);
    return { ...tally, authRequired: this.#authRequired, ...(due.length > 0 ? { nextAttemptAt: Math.min(...due) } : {}) };
  }

  async #sendOne(item: QueueItem, sender: Sender): Promise<Outcome> {
    let result: SendResult;
    try {
      result = await sender({ op: item.op, input: structuredClone(item.input), idempotencyKey: item.idempotencyKey });
    } catch {
      result = { ok: false, error: NETWORK_ERROR };
    }
    const now = this.#o.clock.now();
    const { next, outcome } = this.#classify(item, result, now);
    await this.#mutate((items) => items.map((i) => (i.id === item.id ? next : i)), false);
    return outcome;
  }

  #classify(item: QueueItem, result: SendResult, now: number): { next: QueueItem; outcome: Outcome } {
    if (result.ok) {
      const acked: QueueItem = { ...item, status: 'acked', ackedAt: now, ...(result.response !== undefined ? { response: result.response } : {}) };
      const { lastError: _cleared, ...clean } = acked;
      return { next: clean, outcome: { kind: 'acked' } };
    }
    const { error } = result;
    if (error.category === 'conflict') return { next: { ...item, status: 'conflict', lastError: error }, outcome: { kind: 'conflict' } };
    if (error.category === 'unauthenticated') {
      this.#authRequired = true;
      return { next: { ...item, status: 'pending', lastError: error }, outcome: { kind: 'auth' } };
    }
    if (error.category !== 'rate_limited' && error.category !== 'unavailable') {
      return { next: { ...item, status: 'failed_permanent', attempts: item.attempts + 1, lastError: error }, outcome: { kind: 'failed' } };
    }
    const attempts = item.attempts + 1;
    if (attempts >= this.#o.maxAttempts) {
      const exhausted: QueueError = { code: 'OFFLINE.MAX_ATTEMPTS', category: error.category, message: 'gave up after repeated failures' };
      return { next: { ...item, status: 'failed_permanent', attempts, lastError: exhausted }, outcome: { kind: 'failed' } };
    }
    const delay = Math.max(backoffDelay(attempts, this.#o.random, this.#o.baseDelayMs, this.#o.maxDelayMs), result.retryAfterMs ?? 0);
    return { next: { ...item, status: 'pending', attempts, nextAttemptAt: now + delay, lastError: error }, outcome: { kind: 'retry' } };
  }

  /**
   * Serialized state change. `strict` writes through storage first and rolls back on failure (used when
   * accepting new work); otherwise memory stays authoritative and a storage failure is surfaced via stats.
   */
  #mutate(change: (items: readonly QueueItem[]) => readonly QueueItem[], strict: boolean): Promise<void> {
    const run = this.#lock.then(async () => {
      const next = change(this.#items);
      if (strict) {
        await this.#o.storage.save(next).catch(() => {
          throw unavailable('OFFLINE.STORAGE_FAILED', 'could not save the change on this device');
        });
        this.#items = next;
        return;
      }
      this.#items = next;
      try {
        await this.#o.storage.save(next);
        this.#persistenceFailed = false;
      } catch {
        this.#persistenceFailed = true;
      }
    });
    this.#lock = run.catch(() => undefined);
    return run;
  }
}
