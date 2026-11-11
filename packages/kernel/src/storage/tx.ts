// Unit of work over a driver transaction: optimistic concurrency, leases, idempotency, inbox, dead letters
// with their replay primitives, and media blobs. Semantics live here once so every adapter behaves
// identically. Storage holds no sync outbox: F15.S01.M01 OutboxEntry rows are ordinary records (N24).
import { toIso } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import type { EventEnvelope } from '../events/envelope.ts';
import { bytesToBase64url } from './base64url.ts';
import type { BlobMeta, BlobPrivacy, BlobRow, DeadLetterRow, DriverKind, DriverTx, IndexValues, InboxRow, MigrationRow, RecordQuery, RecordRow } from './driver.ts';
import { blobMachine, inboxMachine } from './machines.ts';
import type { BlobPutEvent, ImageVerifier, StorageSite, TenantLimitsPort } from './ports.ts';

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
    /**
     * Restores an exported record as-is (revision and timestamps kept) for import and restore (IOX-2):
     * absent ⇒ written; identical ⇒ skipped; different ⇒ CONFLICT_REVISION.
     */
    restore(rec: StoredRecord, idx: IndexValues): Result<'restored' | 'identical', AppError> {
      const data = jsonText(rec.data, 'record data');
      const current = d.records.get(rec.tenantId, rec.type, rec.id);
      if (current) return current.revision === rec.revision && current.data === data ? ok('identical') : err(appError('CONFLICT_REVISION', { params: { currentRevision: current.revision } }));
      d.records.upsert({ tenant: rec.tenantId, type: rec.type, id: rec.id, revision: rec.revision, data, idx, createdAt: rec.createdAt, updatedAt: rec.updatedAt });
      return ok('restored');
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
    /** Deletes events older than the cutoff with their inbox rows (RET-SHORT); events held by a dead letter stay. */
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
    /** pending|retry -> done; a requeued event's dead_letter row is deleted in the same transaction. */
    markDone(m: InboxMark, attempts: number): void {
      d.inbox.upsert(row(m, 'done', attempts, null, null));
      if (d.deadLetters.get(m.consumer, m.envelope.eventId)) d.deadLetters.remove(m.consumer, m.envelope.eventId);
    },
    markRetry: (m: InboxMark, attempts: number, nextAttemptAt: number, code: string): void => d.inbox.upsert(row(m, 'retry', attempts, toIso(nextAttemptAt), code)),
    /**
     * pending|retry -> dead with the error code only. A requeued event updates its existing dead_letter row
     * (attempts, error code, deadAt) and keeps replayCount and lastReplayedAt; a first death starts at 0.
     */
    markDead(m: InboxMark, attempts: number, code: string): void {
      d.inbox.upsert(row(m, 'dead', attempts, null, code));
      const prior = d.deadLetters.get(m.consumer, m.envelope.eventId);
      d.deadLetters.upsert({
        consumer: m.consumer,
        eventId: m.envelope.eventId,
        tenant: m.envelope.tenantId,
        type: m.envelope.type,
        envelope: prior?.envelope ?? jsonText(m.envelope, 'envelope'),
        attempts,
        errorCode: code,
        deadAt: toIso(m.now),
        replayCount: prior?.replayCount ?? 0,
        lastReplayedAt: prior?.lastReplayedAt ?? null,
      });
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
  /** Times the replay primitive requeued the event; kept across requeue and re-dead-lettering. */
  readonly replayCount: number;
  readonly lastReplayedAt: string | null;
  /** True while requeued (inbox retry) and not yet delivered or dead again. */
  readonly requeued: boolean;
}

export interface DeadLetterQuery {
  readonly consumer?: string;
  readonly tenantId?: string;
  /** 1..500, default 100. */
  readonly limit?: number;
}

export interface DeadLetterPurgeOptions {
  readonly tenantId?: string;
  readonly limit?: number;
}

/** Codes a requeued dead letter returns to dead with, besides a consumer error code (PS-119-03). */
export type ReturnToDeadCode = 'FEATURE_DISABLED' | 'EXPIRED';

const MAX_DEAD_LETTER_PAGE = 500;

function deadLetterQuery(q: DeadLetterQuery) {
  const limit = q.limit ?? 100;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_DEAD_LETTER_PAGE) throw new RangeError('dead letter limit must be 1..500');
  return { limit, ...(q.consumer === undefined ? {} : { consumer: q.consumer }), ...(q.tenantId === undefined ? {} : { tenant: q.tenantId }) };
}

/**
 * Dead-letter primitives behind F15.S03.M03 platform.deadletter.replay (PS-119-03): list, requeue (dead ->
 * retry with replayCount + 1), return to dead (FEATURE_DISABLED, EXPIRED) and purge (dead -> purged).
 */
function deadLetterStore(d: DriverTx) {
  const toDeadLetter = (r: DeadLetterRow): DeadLetter => ({
    consumer: r.consumer,
    eventId: r.eventId,
    tenantId: r.tenant,
    type: r.type,
    envelope: JSON.parse(r.envelope) as EventEnvelope,
    attempts: r.attempts,
    errorCode: r.errorCode,
    deadAt: r.deadAt,
    replayCount: r.replayCount,
    lastReplayedAt: r.lastReplayedAt,
    requeued: d.inbox.get(r.consumer, r.eventId)?.status === 'retry',
  });

  function purge(before: number, opts: DeadLetterPurgeOptions = {}): number {
    const cutoff = toIso(before);
    const rows = d.deadLetters.purgeable(cutoff, opts.limit ?? Number.MAX_SAFE_INTEGER, opts.tenantId).filter((r) => inboxMachine.can(d.inbox.get(r.consumer, r.eventId)?.status ?? 'dead', 'purge'));
    for (const r of rows) d.deadLetters.remove(r.consumer, r.eventId);
    for (const eventId of new Set(rows.map((r) => r.eventId))) {
      const ev = d.outbox.get(eventId);
      if (!ev) {
        for (const r of rows) if (r.eventId === eventId) d.inbox.remove(r.consumer, eventId);
      } else if (d.deadLetters.countFor(eventId) === 0 && ev.occurredAt < cutoff) {
        // The event is deleted with every consumer's inbox row, so it can never be redelivered.
        d.outbox.remove(eventId);
      }
      // Otherwise another dead letter still holds the event (or it is younger than the cutoff): the dead
      // inbox rows stay so it is not redelivered, and the outbox purge deletes them with the event.
    }
    return rows.length;
  }

  return {
    /** Dead letters ordered by deadAt; `consumer` narrows to one consumer, `tenantId` to one tenant. */
    list: (consumer?: string, limit?: number, tenantId?: string): DeadLetter[] =>
      d.deadLetters.list(deadLetterQuery({ ...(consumer === undefined ? {} : { consumer }), ...(tenantId === undefined ? {} : { tenantId }), ...(limit === undefined ? {} : { limit }) })).map(toDeadLetter),
    get(consumer: string, eventId: string): DeadLetter | undefined {
      const r = d.deadLetters.get(consumer, eventId);
      return r ? toDeadLetter(r) : undefined;
    },
    /** Currently requeued dead letters (inbox retry), for the dispatcher's 7-day return to dead. */
    requeued: (q: DeadLetterQuery = {}): DeadLetter[] => d.deadLetters.requeued(deadLetterQuery(q)).map(toDeadLetter),
    /**
     * dead -> retry: inbox attempts reset to 0, due immediately; the dead_letter row is kept with
     * replayCount + 1 and lastReplayedAt = now. NOT_FOUND without a dead letter; CONFLICT_STATE when the
     * event is already requeued (V05), so each replay is counted once.
     */
    requeue(consumer: string, eventId: string, now: number): Result<DeadLetter, AppError> {
      const dl = d.deadLetters.get(consumer, eventId);
      if (!dl) return err(appError('NOT_FOUND'));
      const inbox = d.inbox.get(consumer, eventId);
      const to = inboxMachine.next(inbox?.status ?? 'pending', 'requeue');
      if (!to.ok) return to;
      const at = toIso(now);
      const next = { ...dl, replayCount: dl.replayCount + 1, lastReplayedAt: at };
      d.deadLetters.upsert(next);
      d.inbox.upsert({ consumer, eventId, aggregateId: inbox?.aggregateId ?? '', status: 'retry', attempts: 0, nextAttemptAt: at, lastError: inbox?.lastError ?? dl.errorCode, updatedAt: at });
      return ok(toDeadLetter(next));
    },
    /**
     * retry -> dead for a requeued event whose consumer module is disabled (FEATURE_DISABLED) or that was not
     * delivered within 7 days of lastReplayedAt (EXPIRED): deadAt = now, replayCount and lastReplayedAt kept.
     */
    returnToDead(consumer: string, eventId: string, code: ReturnToDeadCode, now: number): Result<DeadLetter, AppError> {
      const dl = d.deadLetters.get(consumer, eventId);
      const inbox = d.inbox.get(consumer, eventId);
      if (!dl || !inbox) return err(appError('NOT_FOUND'));
      const to = inboxMachine.next(inbox.status, code === 'EXPIRED' ? 'expire' : 'disable');
      if (!to.ok) return to;
      const at = toIso(now);
      d.inbox.upsert({ ...inbox, status: 'dead', nextAttemptAt: null, lastError: code, updatedAt: at });
      const next = { ...dl, errorCode: code, deadAt: at };
      d.deadLetters.upsert(next);
      return ok(toDeadLetter(next));
    },
    /**
     * dead -> purged: deletes dead letters whose deadAt is before the cutoff and whose event is not requeued,
     * with their inbox rows, in this transaction; an event no dead letter holds any more is deleted with it.
     * Returns the number of dead letters purged (RET-SHORT, 30 days after deadAt by F15.S03.M03's schedule).
     */
    purge,
    /** Alias of purge(before) kept for callers of the first kernel release. */
    purgeBefore: (before: number): number => purge(before),
  };
}

export const MAX_BLOB_BYTES = 5 * 1024 * 1024;
const BLOB_REF_RE = /^blob:sha256-[A-Za-z0-9_-]{43}$/;
const CONTENT_TYPE_RE = /^[a-z]+\/[a-z0-9.+-]{1,90}$/;
const PRIVACY: readonly BlobPrivacy[] = ['P0', 'P1', 'P2', 'P3'];

export interface BlobInfo {
  readonly ref: string;
  readonly size: number;
  readonly contentType: string;
  readonly privacy: BlobPrivacy;
  readonly encrypted: boolean;
  readonly createdAt: string;
  readonly holders: number;
  /**
   * False when an encrypted blob's ciphertext is absent from the relay's blobs_enc store (after a restore
   * from a backup of schema main, or a power loss between the two file commits); get() then returns
   * undefined and F08.S01.M03 expires the attachment rows.
   */
  readonly bytesPresent: boolean;
}

export interface MediaBlob extends BlobInfo {
  readonly bytes: Uint8Array;
}

export interface PutBlobInput {
  readonly tenant: string;
  /** Bytes with metadata already stripped (F10.S02.M03); ciphertext for encrypted blobs (F08). */
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly privacy: BlobPrivacy;
  readonly encrypted?: boolean;
  /** The ref the signed record references; the bytes must hash to it (V11). */
  readonly expectedRef?: string;
  readonly now: number;
}

export function isBlobRef(v: unknown): v is string {
  return typeof v === 'string' && BLOB_REF_RE.test(v);
}

/** Content address `blob:sha256-<base64url>` of the bytes (WebCrypto). */
export async function blobRefOf(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.slice());
  return `blob:sha256-${bytesToBase64url(new Uint8Array(digest))}`;
}

/** Environment of one transaction: where it runs and the ports registered at composition. */
export interface TxEnv {
  readonly kind: DriverKind;
  readonly site: StorageSite;
  readonly tenants?: TenantLimitsPort | undefined;
  readonly imageVerifier?: ImageVerifier | undefined;
  readonly onBlobPut?: ((e: BlobPutEvent) => void) | undefined;
}

/** min(5 MiB, the TenantPort limit): limits(tenantId).maxUploadBytes on a relay, localLimits in the vault (V08). */
export function blobLimitBytes(env: TxEnv, tenant: string): number {
  const port = env.tenants;
  const limit = env.site === 'relay' ? port?.limits?.(tenant)?.maxUploadBytes : port?.localLimits?.()?.maxLocalAttachmentBytes;
  return limit === undefined || !Number.isFinite(limit) ? MAX_BLOB_BYTES : Math.max(0, Math.min(MAX_BLOB_BYTES, Math.floor(limit)));
}

function invalidField(path: string, code: string): AppError {
  return appError('VALIDATION_FAILED', { fields: [{ path, code }] });
}

/** V08, V09, V14 and the relay plaintext rule; checks that need no hashing. */
function blobCheck(input: PutBlobInput, env: TxEnv, encryptedStore: DriverTx['blobs']['encryptedStore']): AppError | undefined {
  const limitBytes = blobLimitBytes(env, input.tenant);
  if (input.bytes.byteLength > limitBytes) return appError('PAYLOAD_TOO_LARGE', { params: { limitBytes } });
  if (!CONTENT_TYPE_RE.test(input.contentType)) return invalidField('contentType', 'INVALID_FORMAT');
  if (!PRIVACY.includes(input.privacy)) return invalidField('privacy', 'INVALID_VALUE');
  if (input.expectedRef !== undefined && !isBlobRef(input.expectedRef)) return invalidField('expectedRef', 'INVALID_BLOB_REF');
  // A relay holds public blobs and ciphertext only (ADR-0016 §3, PRV-5).
  if (env.site === 'relay' && input.privacy !== 'P0' && input.encrypted !== true) return invalidField('privacy', 'PLAINTEXT_NOT_PUBLIC');
  // Fail closed: without the attached blobs_enc store no ciphertext is written anywhere (V14).
  if (input.encrypted === true && encryptedStore === 'unavailable') return appError('INTERNAL', { params: { reason: 'encrypted_blob_store_unavailable' } });
  return undefined;
}

function toBlobInfo(b: BlobMeta, holders: number): BlobInfo {
  return { ref: b.ref, size: b.size, contentType: b.contentType, privacy: b.privacy, encrypted: b.encrypted, createdAt: b.createdAt, holders, bytesPresent: b.bytesPresent };
}

export interface ShreddedBlob {
  readonly tenant: string;
  readonly ref: string;
}

/**
 * Content-addressed media blobs with holder-based reference counting (MediaBlob, PS-119). Every encrypted
 * blob deleted in this transaction, whether by detach, a repository write or the orphan sweep, is listed
 * by shredded() so the key owner deletes its per-object key in the same unit of work.
 */
function blobStore(d: DriverTx, env: TxEnv) {
  const shredded: ShreddedBlob[] = [];
  const removeBlob = (b: Pick<BlobRow, 'tenant' | 'ref' | 'encrypted'>): void => {
    d.blobs.remove(b.tenant, b.ref);
    if (b.encrypted) shredded.push({ tenant: b.tenant, ref: b.ref });
  };
  const report = (outcome: BlobPutEvent['outcome'], code: string, input: PutBlobInput): void => env.onBlobPut?.({ outcome, code, size: input.bytes.byteLength, contentType: input.contentType });
  const reject = (e: AppError, input: PutBlobInput): Result<never, AppError> => {
    report('rejected', e.code, input);
    return err(e);
  };
  /** Relay receipt check of plaintext images (V12): the registered verifier sees a copy, never the stored bytes. */
  const verify = async (input: PutBlobInput): Promise<Result<void, AppError>> => {
    if (env.site !== 'relay' || input.encrypted === true || !input.contentType.startsWith('image/')) return ok(undefined);
    if (!env.imageVerifier) return err(appError('INTERNAL', { params: { reason: 'image_verifier_not_registered' } }));
    return env.imageVerifier.verifyImageClean(input.bytes.slice(), input.contentType);
  };
  const detach = (tenant: string, ref: string, holder: string): { deleted: boolean; shred: boolean } => {
    d.blobs.detach(tenant, ref, holder);
    const blob = d.blobs.meta(tenant, ref);
    if (!blob) return { deleted: false, shred: false };
    const next = blobMachine.next('referenced', d.blobs.holders(tenant, ref) > 0 ? 'holders_changed' : 'detach_last');
    if (!next.ok || next.value !== 'deleted') return { deleted: false, shred: false };
    removeBlob(blob);
    return { deleted: true, shred: blob.encrypted };
  };
  return {
    /**
     * Stores exactly the received bytes under their content address after the size, format, expectedRef and
     * (on a relay) verifyImageClean checks. Identical bytes return the existing blob (a more public class
     * lowers the stored class); an encrypted blob whose ciphertext is absent is written again.
     */
    async put(input: PutBlobInput): Promise<Result<BlobInfo, AppError>> {
      const bad = blobCheck(input, env, d.blobs.encryptedStore);
      if (bad) return reject(bad, input);
      const bytes = input.bytes.slice();
      const ref = await blobRefOf(bytes);
      if (input.expectedRef !== undefined && ref !== input.expectedRef) return reject(invalidField('expectedRef', 'REF_MISMATCH'), input);
      const clean = await verify(input);
      if (!clean.ok) return reject(clean.error, input);
      const existing = d.blobs.meta(input.tenant, ref);
      const holders = d.blobs.holders(input.tenant, ref);
      if (existing && existing.bytesPresent) {
        const privacy = input.privacy < existing.privacy ? input.privacy : existing.privacy;
        if (privacy !== existing.privacy) d.blobs.setPrivacy(input.tenant, ref, privacy);
        report('duplicate', 'OK', input);
        return ok(toBlobInfo({ ...existing, privacy }, holders));
      }
      const row: BlobRow = {
        tenant: input.tenant,
        ref,
        bytes,
        size: bytes.byteLength,
        contentType: existing?.contentType ?? input.contentType,
        privacy: existing && existing.privacy < input.privacy ? existing.privacy : input.privacy,
        encrypted: existing?.encrypted ?? input.encrypted === true,
        createdAt: existing?.createdAt ?? toIso(input.now),
      };
      d.blobs.upsert(row);
      report('stored', 'OK', input);
      return ok(toBlobInfo({ ...row, bytesPresent: true }, holders));
    },
    /** The stored bytes, or undefined when absent (including an encrypted blob whose ciphertext is missing). */
    get(tenant: string, ref: string): MediaBlob | undefined {
      const b = d.blobs.get(tenant, ref);
      return b && b.bytes ? { ...toBlobInfo(b, d.blobs.holders(tenant, ref)), bytes: b.bytes } : undefined;
    },
    info(tenant: string, ref: string): BlobInfo | undefined {
      const b = d.blobs.meta(tenant, ref);
      return b ? toBlobInfo(b, d.blobs.holders(tenant, ref)) : undefined;
    },
    /** Records that `holder` (e.g. `bazaar.listing/<id>`) references the blob; idempotent. */
    attach(tenant: string, ref: string, holder: string): Result<{ holders: number; present: boolean }, AppError> {
      if (!isBlobRef(ref)) return err(invalidField('ref', 'INVALID_BLOB_REF'));
      d.blobs.attach(tenant, ref, holder);
      return ok({ holders: d.blobs.holders(tenant, ref), present: d.blobs.meta(tenant, ref) !== undefined });
    },
    /** Drops one reference; the blob is deleted with its last reference. `shred` asks the owner to delete the blob key. */
    detach,
    /**
     * Orphan sweep: deletes stored blobs that no record references and that were created before the cutoff
     * (stored -> deleted), and ciphertext rows of the relay's blobs_enc store without a metadata row.
     * Returns the number of rows deleted.
     */
    collectOrphans(createdBefore: number, limit = 100): number {
      const list = d.blobs.orphans(toIso(createdBefore), limit);
      for (const o of list) if (blobMachine.can('stored', 'sweep')) removeBlob(o);
      const strays = d.blobs.orphanCiphertext(limit);
      for (const c of strays) d.blobs.removeCiphertext(c.tenant, c.ref);
      return list.length + strays.length;
    },
    /** Encrypted blobs deleted so far in this transaction (empty again after rollback: the list dies with it). */
    shredded: (): readonly ShreddedBlob[] => [...shredded],
  };
}

function migrationStore(d: DriverTx) {
  return {
    list: (): MigrationRow[] => d.migrations.list(),
    insert: (row: MigrationRow): void => d.migrations.insert(row),
  };
}

const DEFAULT_ENV: TxEnv = { kind: 'memory', site: 'vault' };

export function createTx(d: DriverTx, env: TxEnv = DEFAULT_ENV) {
  return {
    blobs: blobStore(d, env),
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
