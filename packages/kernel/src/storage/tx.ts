// Unit of work over a driver transaction: optimistic concurrency, leases, idempotency, inbox,
// dead letters and the sync outbox. Semantics live here once so every adapter behaves identically.
import { toIso } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import type { EventEnvelope } from '../events/envelope.ts';
import type { DeadLetterRow, DriverTx, IndexValues, InboxRow, MigrationRow, RecordQuery, RecordRow, SyncListQuery, SyncRow, SyncState } from './driver.ts';
import { syncMachine, type SyncEvent } from './machines.ts';

export interface StoredRecord<T = unknown> {
  readonly tenantId: string;
  readonly type: string;
  readonly id: string;
  readonly revision: number;
  readonly data: T;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PutRecordInput {
  readonly tenant: string;
  readonly type: string;
  readonly id: string;
  readonly data: unknown;
  readonly idx: IndexValues;
  /** 0 creates (must not exist); n >= 1 updates revision n (CTR-IDM-001 IDM-2). */
  readonly expectedRevision: number;
  readonly now: number;
}

export interface Lease {
  readonly resourceId: string;
  readonly holder: string;
  readonly acquiredAt: string;
  readonly expiresAt: string;
  /** Fencing counter: increases on every new acquisition of the resource. */
  readonly fence: number;
}

export interface LeaseRequest {
  readonly tenant: string;
  readonly resourceId: string;
  readonly holder: string;
  readonly now: number;
}

export interface IdempotencyRecord {
  readonly tenant: string;
  readonly actor: string;
  readonly command: string;
  readonly key: string;
  readonly requestHash: string;
  readonly status: number;
  readonly response: unknown;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface IdempotencyKeyRef {
  readonly tenant: string;
  readonly actor: string;
  readonly command: string;
  readonly key: string;
}

/** A signed statement (CTR-FED-001 envelope); the kernel treats it as opaque JSON with cid and type. */
export interface SignedEnvelope {
  readonly cid: string;
  readonly type: string;
  readonly [field: string]: unknown;
}

export interface SyncEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly destination: string;
  readonly ref: string;
  readonly envelope: SignedEnvelope;
  readonly state: SyncState;
  readonly attempts: number;
  readonly nextAttemptAt: string | null;
  readonly lastError: string | null;
  readonly receipt: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SyncTransitionPatch {
  readonly attempts?: number;
  readonly nextAttemptAt?: string | null;
  readonly lastError?: string | null;
  readonly receipt?: unknown;
}

export const DEFAULT_LEASE_TTL_MS = 15 * 60 * 1000;
const MAX_LEASE_TTL_MS = 24 * 60 * 60 * 1000;

function toStored<T>(row: RecordRow): StoredRecord<T> {
  return { tenantId: row.tenant, type: row.type, id: row.id, revision: row.revision, data: JSON.parse(row.data) as T, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

function jsonText(value: unknown, what: string): string {
  const text = JSON.stringify(value);
  if (text === undefined) throw new TypeError(`${what} must be JSON-serializable`);
  return text;
}

function checkRevision(expected: number): void {
  if (!Number.isInteger(expected) || expected < 0) throw new RangeError('expectedRevision must be an integer >= 0');
}

function casCheck(current: RecordRow | undefined, expected: number): Result<number, AppError> {
  if (expected >= 1 && !current) return err(appError('NOT_FOUND'));
  const currentRevision = current?.revision ?? 0;
  if (currentRevision !== expected) return err(appError('CONFLICT_REVISION', { params: { currentRevision } }));
  return ok(currentRevision);
}

function recordStore(d: DriverTx) {
  return {
    get<T = unknown>(tenant: string, type: string, id: string): StoredRecord<T> | undefined {
      const row = d.records.get(tenant, type, id);
      return row ? toStored<T>(row) : undefined;
    },
    put<T = unknown>(input: PutRecordInput): Result<StoredRecord<T>, AppError> {
      checkRevision(input.expectedRevision);
      const current = d.records.get(input.tenant, input.type, input.id);
      const cas = casCheck(current, input.expectedRevision);
      if (!cas.ok) return cas;
      const now = toIso(input.now);
      const row: RecordRow = {
        tenant: input.tenant,
        type: input.type,
        id: input.id,
        revision: cas.value + 1,
        data: jsonText(input.data, 'record data'),
        idx: input.idx,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      };
      d.records.upsert(row);
      return ok(toStored<T>(row));
    },
    remove(tenant: string, type: string, id: string, expectedRevision: number): Result<void, AppError> {
      checkRevision(expectedRevision);
      const current = d.records.get(tenant, type, id);
      if (!current) return err(appError('NOT_FOUND'));
      const cas = casCheck(current, expectedRevision);
      if (!cas.ok) return cas;
      d.records.remove(tenant, type, id);
      return ok(undefined);
    },
    query<T = unknown>(q: RecordQuery): StoredRecord<T>[] {
      return d.records.query(q).map((r) => toStored<T>(r));
    },
  };
}

function toLease(r: { resourceId: string; holder: string; acquiredAt: string; expiresAt: string; fence: number }): Lease {
  return { resourceId: r.resourceId, holder: r.holder, acquiredAt: r.acquiredAt, expiresAt: r.expiresAt, fence: r.fence };
}

function checkTtl(ttlMs: number): void {
  if (!Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_LEASE_TTL_MS) throw new RangeError('lease ttlMs must be 1 ms .. 24 h');
}

/** Leases per CTR-IDM-001 IDM-3/IDM-8: compare-and-set acquire, renew by holder, release, expiry at expiresAt. */
function leaseStore(d: DriverTx) {
  const active = (req: { tenant: string; resourceId: string; now: number }) => {
    const row = d.leases.get(req.tenant, req.resourceId);
    return row && row.expiresAt > toIso(req.now) ? row : undefined;
  };
  return {
    get: (tenant: string, resourceId: string, now: number): Lease | undefined => {
      const row = active({ tenant, resourceId, now });
      return row ? toLease(row) : undefined;
    },
    acquire(req: LeaseRequest & { readonly ttlMs?: number }): Result<Lease, AppError> {
      const ttl = req.ttlMs ?? DEFAULT_LEASE_TTL_MS;
      checkTtl(ttl);
      const held = active(req);
      if (held && held.holder !== req.holder) return err(appError('PRECONDITION_FAILED', { params: { reason: 'lease_held', resourceId: req.resourceId } }));
      const prior = d.leases.get(req.tenant, req.resourceId);
      const row = {
        tenant: req.tenant,
        resourceId: req.resourceId,
        holder: req.holder,
        acquiredAt: held ? held.acquiredAt : toIso(req.now),
        expiresAt: toIso(req.now + ttl),
        fence: held ? held.fence : (prior?.fence ?? 0) + 1,
      };
      d.leases.upsert(row);
      return ok(toLease(row));
    },
    renew(req: LeaseRequest & { readonly ttlMs?: number }): Result<Lease, AppError> {
      const ttl = req.ttlMs ?? DEFAULT_LEASE_TTL_MS;
      checkTtl(ttl);
      const row = d.leases.get(req.tenant, req.resourceId);
      if (!row) return err(appError('NOT_FOUND'));
      if (row.holder !== req.holder) {
        return active(req) ? err(appError('PRECONDITION_FAILED', { params: { reason: 'lease_held', resourceId: req.resourceId } })) : err(appError('EXPIRED', { params: { resourceId: req.resourceId } }));
      }
      if (!active(req)) return err(appError('EXPIRED', { params: { resourceId: req.resourceId } }));
      const next = { ...row, expiresAt: toIso(req.now + ttl) };
      d.leases.upsert(next);
      return ok(toLease(next));
    },
    release(req: LeaseRequest): Result<void, AppError> {
      const held = active(req);
      if (!held) return ok(undefined);
      if (held.holder !== req.holder) return err(appError('PRECONDITION_FAILED', { params: { reason: 'lease_held', resourceId: req.resourceId } }));
      d.leases.upsert({ ...held, expiresAt: toIso(req.now) });
      return ok(undefined);
    },
  };
}

function idempotencyStore(d: DriverTx) {
  return {
    /** Returns the stored response unless it expired (24 h validity, IDM-1). */
    lookup(ref: IdempotencyKeyRef, now: number): IdempotencyRecord | undefined {
      const row = d.idempotency.get(ref.tenant, ref.actor, ref.command, ref.key);
      if (!row || row.expiresAt <= toIso(now)) return undefined;
      return { ...row, response: JSON.parse(row.response) as unknown };
    },
    save(rec: IdempotencyRecord): void {
      d.idempotency.upsert({ ...rec, response: jsonText(rec.response ?? null, 'idempotent response') });
    },
    purgeExpired: (now: number): number => d.idempotency.purgeExpired(toIso(now)),
  };
}

export interface PendingEvent {
  readonly seq: number;
  readonly envelope: EventEnvelope;
}

function outboxStore(d: DriverTx) {
  return {
    append(env: EventEnvelope): number {
      return d.outbox.append({
        eventId: env.eventId,
        tenant: env.tenantId,
        type: env.type,
        aggregateType: env.aggregate.type,
        aggregateId: env.aggregate.id,
        revision: env.revision,
        occurredAt: env.occurredAt,
        envelope: jsonText(env, 'event envelope'),
      });
    },
    get(eventId: string): EventEnvelope | undefined {
      const row = d.outbox.get(eventId);
      return row ? (JSON.parse(row.envelope) as EventEnvelope) : undefined;
    },
    pending(consumer: string, types: readonly string[], now: number, limit: number): PendingEvent[] {
      return d.outbox.pending({ consumer, types, now: toIso(now), limit }).map((r) => ({ seq: r.seq, envelope: JSON.parse(r.envelope) as EventEnvelope }));
    },
    oldestUndelivered(consumer: string, types: readonly string[]): EventEnvelope | undefined {
      const row = d.outbox.oldestUndelivered(consumer, types);
      return row ? (JSON.parse(row.envelope) as EventEnvelope) : undefined;
    },
    purgeBefore: (before: number): number => d.outbox.purgeBefore(toIso(before)),
  };
}

export interface InboxMark {
  readonly consumer: string;
  readonly envelope: EventEnvelope;
  readonly now: number;
}

function inboxStore(d: DriverTx) {
  const row = (m: InboxMark, status: InboxRow['status'], attempts: number, next: string | null, code: string | null): InboxRow => ({
    consumer: m.consumer,
    eventId: m.envelope.eventId,
    aggregateId: m.envelope.aggregate.id,
    status,
    attempts,
    nextAttemptAt: next,
    lastError: code,
    updatedAt: toIso(m.now),
  });
  return {
    get: (consumer: string, eventId: string): InboxRow | undefined => d.inbox.get(consumer, eventId),
    markDone: (m: InboxMark, attempts: number): void => d.inbox.upsert(row(m, 'done', attempts, null, null)),
    markRetry: (m: InboxMark, attempts: number, nextAttemptAt: number, code: string): void => d.inbox.upsert(row(m, 'retry', attempts, toIso(nextAttemptAt), code)),
    markDead(m: InboxMark, attempts: number, code: string): void {
      d.inbox.upsert(row(m, 'dead', attempts, null, code));
      d.deadLetters.upsert({ consumer: m.consumer, eventId: m.envelope.eventId, tenant: m.envelope.tenantId, type: m.envelope.type, envelope: jsonText(m.envelope, 'envelope'), attempts, errorCode: code, deadAt: toIso(m.now) });
    },
  };
}

export interface DeadLetter {
  readonly consumer: string;
  readonly eventId: string;
  readonly tenantId: string;
  readonly type: string;
  readonly envelope: EventEnvelope;
  readonly attempts: number;
  readonly errorCode: string;
  readonly deadAt: string;
}

function toDeadLetter(r: DeadLetterRow): DeadLetter {
  return { consumer: r.consumer, eventId: r.eventId, tenantId: r.tenant, type: r.type, envelope: JSON.parse(r.envelope) as EventEnvelope, attempts: r.attempts, errorCode: r.errorCode, deadAt: r.deadAt };
}

function deadLetterStore(d: DriverTx) {
  return {
    list: (consumer: string | undefined, limit = 100): DeadLetter[] => d.deadLetters.list(consumer, limit).map(toDeadLetter),
    get(consumer: string, eventId: string): DeadLetter | undefined {
      const r = d.deadLetters.get(consumer, eventId);
      return r ? toDeadLetter(r) : undefined;
    },
    /** Moves a dead letter back to retry, due immediately, with attempts reset (replay primitive for EVT-6). */
    requeue(consumer: string, eventId: string, now: number): Result<void, AppError> {
      const dl = d.deadLetters.get(consumer, eventId);
      const inbox = d.inbox.get(consumer, eventId);
      if (!dl || !inbox || inbox.status !== 'dead') return err(appError('NOT_FOUND'));
      d.deadLetters.remove(consumer, eventId);
      d.inbox.upsert({ ...inbox, status: 'retry', attempts: 0, nextAttemptAt: toIso(now), updatedAt: toIso(now) });
      return ok(undefined);
    },
  };
}

function toSyncEntry(r: SyncRow): SyncEntry {
  return {
    id: r.id,
    tenantId: r.tenant,
    destination: r.destination,
    ref: r.ref,
    envelope: JSON.parse(r.envelope) as SignedEnvelope,
    state: r.state,
    attempts: r.attempts,
    nextAttemptAt: r.nextAttemptAt,
    lastError: r.lastError,
    receipt: r.receipt === null ? null : (JSON.parse(r.receipt) as unknown),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export interface EnqueueStatement {
  readonly id: string;
  readonly tenant: string;
  readonly destination: string;
  readonly envelope: SignedEnvelope;
  readonly now: number;
}

function syncStore(d: DriverTx) {
  return {
    enqueue(input: EnqueueStatement): SyncEntry {
      if (typeof input.envelope.cid !== 'string' || typeof input.envelope.type !== 'string') throw new TypeError('signed envelope requires cid and type');
      const now = toIso(input.now);
      const row: SyncRow = { id: input.id, tenant: input.tenant, destination: input.destination, ref: input.envelope.cid, envelope: jsonText(input.envelope, 'signed envelope'), state: 'prepared', attempts: 0, nextAttemptAt: null, lastError: null, receipt: null, createdAt: now, updatedAt: now };
      d.sync.upsert(row);
      return toSyncEntry(row);
    },
    get(id: string): SyncEntry | undefined {
      const r = d.sync.get(id);
      return r ? toSyncEntry(r) : undefined;
    },
    list: (q: Partial<SyncListQuery> = {}): SyncEntry[] => d.sync.list({ ...q, limit: q.limit ?? 100 }).map(toSyncEntry),
    heads: (now: number, limit: number): SyncEntry[] => d.sync.heads(toIso(now), limit).map(toSyncEntry),
    /** Applies a declared sync-outbox transition; undeclared ones return CONFLICT_STATE. */
    transition(id: string, event: SyncEvent, patch: SyncTransitionPatch, now: number): Result<SyncEntry, AppError> {
      const row = d.sync.get(id);
      if (!row) return err(appError('NOT_FOUND'));
      const to = syncMachine.next(row.state, event);
      if (!to.ok) return to;
      const receipt = patch.receipt === undefined ? row.receipt : jsonText(patch.receipt, 'receipt');
      const next: SyncRow = {
        ...row,
        state: to.value,
        attempts: patch.attempts ?? row.attempts,
        nextAttemptAt: patch.nextAttemptAt === undefined ? row.nextAttemptAt : patch.nextAttemptAt,
        lastError: patch.lastError === undefined ? row.lastError : patch.lastError,
        receipt,
        updatedAt: toIso(now),
      };
      d.sync.upsert(next);
      return ok(toSyncEntry(next));
    },
  };
}

function migrationStore(d: DriverTx) {
  return {
    list: (): MigrationRow[] => d.migrations.list(),
    insert: (row: MigrationRow): void => d.migrations.insert(row),
  };
}

export function createTx(d: DriverTx) {
  return {
    records: recordStore(d),
    leases: leaseStore(d),
    idempotency: idempotencyStore(d),
    outbox: outboxStore(d),
    inbox: inboxStore(d),
    deadLetters: deadLetterStore(d),
    sync: syncStore(d),
    migrations: migrationStore(d),
  };
}

/** Unit of work handed to transaction callbacks. */
export type Tx = ReturnType<typeof createTx>;
