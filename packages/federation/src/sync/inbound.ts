/**
 * Inbound pipeline of F11.S02.M02 (dedup/replay) and F11.S02.M03 (conflicts): authenticates a peer's signed
 * batch, then admits records one by one. A bad record never fails its batch: it is rejected with a reason, counted
 * in the peer's reputation, and the rest proceeds. Per-record order of checks is cheapest first; signatures are
 * verified before deduplication so a forged envelope can neither import nor masquerade as a known duplicate.
 */
import type { CommandContext, EventInput, Operation } from '@classrup/kernel';
import { defineOperations, forbidden, parse, runCommand, unauthenticated, z } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';
import type { Blocklists } from '../interop/blocklists';
import type { Migration } from '../interop/migration';
import type { Trust } from '../interop/trust';
import type { RejectReason } from '../protocol/records';
import { hashRecord, keyIdSchema, relayIdSchema, signatureSchema, validateEnvelope } from '../protocol/records';
import { BATCH_CONTEXT, verifyAuthor, verifyBatch, verifyCountersign } from '../protocol/signatures';
import type { FederatedEnvelope, FederationBatch, MigrationProof, Peer, StoredRecord } from '../types';
import type { Env } from '../support';
import { CLOCK_SKEW_MS, col, COLLECTIONS, FLAGS, MAX_BATCH_RECORDS, recordKey, requireProtocolFlags } from '../support';
import { classify, conflictEvent, recordConflict, resolve } from './conflicts';
import { createReplayGuard, markSeen, purgeExpired, seenKey, wasSeen } from './dedup';

const receiveSchema = z.strictObject({
  batch: z.strictObject({
    v: z.literal(1),
    ctx: z.literal(BATCH_CONTEXT),
    signer: keyIdSchema,
    payload: z.strictObject({
      v: z.literal(1),
      batchId: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
      from: relayIdSchema,
      sentAt: z.number().int().nonnegative(),
      records: z.array(z.unknown()).max(MAX_BATCH_RECORDS),
    }),
    sig: signatureSchema,
  }),
});

export type RecordOutcome = 'imported' | 'duplicate' | 'rejected';

export interface RecordResult {
  readonly recordId?: string;
  readonly revision?: number;
  readonly outcome: RecordOutcome;
  readonly reason?: RejectReason;
}

export interface ReceiveResult {
  readonly batchId: string;
  readonly imported: number;
  readonly duplicates: number;
  readonly rejected: number;
  readonly results: readonly RecordResult[];
}

interface Processed {
  readonly result: RecordResult;
  readonly events: readonly EventInput<unknown>[];
}

export function createInbound(env: Env, trust: Trust, blocklists: Blocklists, migration: Migration) {
  const { deps } = env;
  const records = () => col<StoredRecord>(env, COLLECTIONS.records);

  const reject = (reason: RejectReason, envelope?: FederatedEnvelope): Processed => ({
    result: { outcome: 'rejected', reason, ...(envelope ? { recordId: envelope.record.recordId, revision: envelope.record.revision } : {}) },
    events: [],
  });

  /** Cheap structural and policy checks; returns a rejection reason or undefined. */
  function admissionCheck(tenantId: string, peer: Peer, envelope: FederatedEnvelope): RejectReason | undefined {
    const { record } = envelope;
    if (record.originRelay !== peer.relayId) return 'origin_mismatch';
    if (record.createdAt > deps.clock.now() + CLOCK_SKEW_MS) return 'future_dated';
    if (blocklists.isBlocked(tenantId, 'domain', record.originRelay)) return 'blocked_domain';
    if (blocklists.isBlocked(tenantId, 'author_key', record.authorKeyId)) return 'blocked_author';
    if (!verifyAuthor(envelope)) return 'bad_author_signature';
    if (!verifyCountersign(envelope, peer.publicKeyId)) return 'bad_relay_signature';
    if (record.type === 'moderation.label' && record.authorKeyId !== peer.publicKeyId) return 'author_key_mismatch';
    return undefined;
  }

  function processRecord(tenantId: string, peer: Peer, raw: unknown): Processed {
    const checked = validateEnvelope(raw);
    if (!checked.ok) return reject(checked.error);
    const envelope = checked.value;
    const { record } = envelope;
    const failure = admissionCheck(tenantId, peer, envelope);
    if (failure) return reject(failure, envelope);

    const contentHash = hashRecord(record);
    const seen = seenKey(record.originRelay, record.recordId, record.revision, contentHash);
    const ref = { recordId: record.recordId, revision: record.revision };
    if (wasSeen(env, seen)) return { result: { ...ref, outcome: 'duplicate' }, events: [] };

    const key = recordKey(record.originRelay, record.recordId);
    const existing = records().get(key);
    const incoming = { type: record.type, revision: record.revision, contentHash };
    const conflicts: EventInput<unknown>[] = [];
    if (existing) {
      if (!migration.isSameAuthor(tenantId, existing.authorKeyId, record.authorKeyId)) {
        conflicts.push(conflictEvent(recordConflict(env, { tenantId, recordKey: key, kind: 'author_mismatch', winner: 'existing', existing, incoming, peerId: peer.id })));
        return { result: { ...ref, outcome: 'rejected', reason: 'author_key_mismatch' }, events: conflicts };
      }
      const winner = resolve(existing, incoming);
      if (winner === 'same') {
        markSeen(env, tenantId, seen);
        return { result: { ...ref, outcome: 'duplicate' }, events: [] };
      }
      const kind = classify(existing, incoming);
      if (kind) conflicts.push(conflictEvent(recordConflict(env, { tenantId, recordKey: key, kind, winner, existing, incoming, peerId: peer.id })));
      if (winner === 'existing') {
        markSeen(env, tenantId, seen);
        const reason: RejectReason = existing.state === 'tombstoned' ? 'tombstoned' : 'stale_revision';
        return { result: { ...ref, outcome: 'rejected', reason }, events: conflicts };
      }
    }
    const stored = store(tenantId, peer, envelope, contentHash, existing);
    markSeen(env, tenantId, seen);
    return { result: { ...ref, outcome: 'imported' }, events: [...conflicts, importedEvent(stored)] };
  }

  function store(tenantId: string, peer: Peer, envelope: FederatedEnvelope, contentHash: string, existing: StoredRecord | undefined): StoredRecord {
    const { record } = envelope;
    const tombstone = record.type === 'tombstone';
    const redirect = tombstone ? (record.payload.redirect as StoredRecord['redirectTo'] | undefined) : undefined;
    if (tombstone && record.payload.reason === 'migrated') migration.registerFromPeer(tenantId, record.payload.migration as MigrationProof);
    return records().put(
      {
        id: recordKey(record.originRelay, record.recordId), tenantId, originRelay: record.originRelay, recordId: record.recordId, type: record.type, revision: record.revision,
        authorKeyId: record.authorKeyId, contentHash, envelope, state: tombstone ? 'tombstoned' : 'active', source: 'inbound', receivedFrom: peer.id, receivedAt: deps.clock.now(),
        ...(redirect ? { redirectTo: redirect } : {}),
      },
      existing?.version ?? 0,
    );
  }

  const importedEvent = (r: StoredRecord): EventInput<unknown> => ({
    type: r.state === 'tombstoned' ? 'federation.record.tombstoned' : 'federation.record.imported', aggregateType: 'federated_record', aggregateId: r.id, revision: r.version,
    payload: { originRelay: r.originRelay, recordId: r.recordId, recordType: r.type, revision: r.revision, contentHash: r.contentHash },
  });

  function receive(ctx: CommandContext, input: unknown): ReceiveResult {
    const req = parse(receiveSchema, input);
    return runCommand(deps, ctx, { name: 'federation.sync.receive', flag: FLAGS.dedup, request: { batchId: req.batch.payload.batchId, from: req.batch.payload.from } }, () => {
      const { actor } = ctx;
      requireProtocolFlags(env, actor.tenantId, FLAGS.conflicts);
      deps.authz.authorize(actor, 'federation.sync:receive', { type: 'federation.sync', tenantId: actor.tenantId });
      const { batch } = req;
      const peer = trust.byRelay(actor.tenantId, batch.payload.from);
      if (!peer) throw unauthenticated('FEDERATION.PEER_UNKNOWN', 'sender is not a registered peer');
      if (peer.status === 'blocked' || blocklists.isBlocked(actor.tenantId, 'peer', peer.relayId)) throw forbidden('FEDERATION.PEER_BLOCKED', 'peer is blocked');
      if (peer.status !== 'trusted') throw forbidden('FEDERATION.PEER_NOT_TRUSTED', 'peer is not trusted');
      if (!verifyBatch(batch as SignedEnvelope<FederationBatch>, peer.publicKeyId)) throw unauthenticated('FEDERATION.BATCH_SIGNATURE_INVALID', 'batch signature does not match the pinned peer key');
      createReplayGuard(env).check(batch.payload.batchId, batch.payload.sentAt, deps.clock.now());
      const bytes = JSON.stringify(batch.payload.records).length;
      trust.admit(peer, batch.payload.records.length, bytes);

      const processed = batch.payload.records.map((raw) => processRecord(actor.tenantId, peer, raw));
      const results = processed.map((p) => p.result);
      const rejected = results.filter((r) => r.outcome === 'rejected');
      const outcome = {
        records: results.length, bytes, accepted: results.filter((r) => r.outcome === 'imported').length, duplicates: results.filter((r) => r.outcome === 'duplicate').length,
        rejected: rejected.map((r) => r.reason as string),
      };
      const { suspended } = trust.commitTraffic(peer, outcome);
      const events: EventInput<unknown>[] = processed.flatMap((p) => [...p.events]);
      events.push(
        ...rejected.map((r) => ({
          type: 'federation.record.rejected', aggregateType: 'peer', aggregateId: peer.id, revision: peer.version,
          payload: { peerId: peer.id, reason: r.reason as string, ...(r.recordId ? { recordId: r.recordId, revision: r.revision as number } : {}) },
        })),
      );
      if (suspended) {
        events.push({ type: 'federation.peer.status_changed', aggregateType: 'peer', aggregateId: peer.id, revision: suspended.version, payload: { peerId: peer.id, relayId: peer.relayId, status: 'suspended', from: 'trusted' } });
      }
      return { result: { batchId: batch.payload.batchId, imported: outcome.accepted, duplicates: outcome.duplicates, rejected: rejected.length, results }, events };
    });
  }

  /** Housekeeping sweeper: forgets expired replay nonces and old duplicate markers. */
  function purge(ctx: CommandContext): { nonces: number; seen: number } {
    return runCommand(deps, ctx, { name: 'federation.sync.purge_expired', flag: FLAGS.dedup, request: {} }, () => {
      deps.authz.authorize(ctx.actor, 'federation.sync:purge', { type: 'federation.sync', tenantId: ctx.actor.tenantId });
      return { result: purgeExpired(env, ctx.actor.tenantId) };
    });
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.sync.receive', kind: 'command', flag: FLAGS.dedup, summary: 'Relay: ingest a signed batch from a trusted peer', handler: receive },
    { name: 'federation.sync.purge_expired', kind: 'command', flag: FLAGS.dedup, summary: 'System: forget expired nonces and duplicate markers', handler: (ctx) => purge(ctx) },
  ]);

  return { receive, purge, operations };
}

export type Inbound = ReturnType<typeof createInbound>;
