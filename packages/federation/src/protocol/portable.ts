/**
 * F11.S01.M01 portable: explicit opt-in publishing of an account's public records, and export of everything an
 * account has federated. Nothing leaves this relay unless the author turned federation on for that record and
 * still holds federation consent. The relay never holds author keys: the client signs, the relay validates,
 * countersigns and queues delivery.
 */
import type { Actor, CommandContext, ListingSnapshot, Operation } from '@classrup/kernel';
import { conflict, defineOperations, forbidden, notFound, parse, precondition, requireFeature, runCommand, validationError, z } from '@classrup/kernel';
import { keyIdOf } from '@classrup/security';
import type { Migration } from '../interop/migration';
import { cancelPending, enqueueDeliveries } from '../sync/outbox';
import type { FederatedEnvelope, FederationMark, StoredRecord } from '../types';
import type { Env } from '../support';
import { col, COLLECTIONS, FLAGS, recordKey, relayKeyId, requireProtocolFlags } from '../support';
import { envelopeSchema, hashRecord, relayIdSchema, validateEnvelope } from './records';
import type { RejectReason } from './records';
import { countersign, signRecord, verifyAuthor } from './signatures';

const markSchema = z.strictObject({ recordId: z.string().regex(/^[A-Za-z0-9_.:-]{8,80}$/), federate: z.boolean() });
const publishSchema = z.strictObject({ envelope: envelopeSchema.pick({ record: true, authorSig: true }) });
const labelSchema = z.strictObject({
  recordId: z.string().regex(/^[A-Za-z0-9_.:-]{8,80}$/).optional(),
  targetRecordId: z.string().regex(/^[A-Za-z0-9_.:-]{8,80}$/),
  label: z.enum(['spam', 'scam', 'prohibited', 'misleading', 'duplicate', 'unsafe']),
  severity: z.enum(['info', 'warn', 'block']),
  note: z.string().max(280).optional(),
});
const getSchema = z.strictObject({ originRelay: relayIdSchema, recordId: z.string().regex(/^[A-Za-z0-9_.:-]{8,80}$/) });

const REJECT_CODES: Readonly<Record<RejectReason, string>> = {
  malformed: 'FEDERATION.RECORD_MALFORMED',
  too_large: 'FEDERATION.RECORD_TOO_LARGE',
  privacy_violation: 'FEDERATION.PRIVACY_VIOLATION',
  invalid_payload: 'FEDERATION.PAYLOAD_INVALID',
  origin_mismatch: 'FEDERATION.ORIGIN_MISMATCH',
  future_dated: 'FEDERATION.RECORD_FUTURE',
  blocked_peer: 'FEDERATION.PEER_BLOCKED',
  blocked_domain: 'FEDERATION.DOMAIN_BLOCKED',
  blocked_author: 'FEDERATION.AUTHOR_BLOCKED',
  bad_author_signature: 'FEDERATION.SIGNATURE_INVALID',
  bad_relay_signature: 'FEDERATION.SIGNATURE_INVALID',
  author_key_mismatch: 'FEDERATION.AUTHOR_KEY_MISMATCH',
  stale_revision: 'FEDERATION.REVISION_NOT_NEWER',
  tombstoned: 'FEDERATION.RECORD_TOMBSTONED',
};

export interface PublishedDto {
  readonly originRelay: string;
  readonly recordId: string;
  readonly type: string;
  readonly revision: number;
  readonly contentHash: string;
  readonly queuedFor: number;
}

export interface MarkResult {
  readonly recordId: string;
  readonly federate: boolean;
  /** True when the record was already published: submit a signed tombstone to withdraw it from peers. */
  readonly withdrawalNeeded: boolean;
}

export interface PublicRecordDto {
  readonly originRelay: string;
  readonly recordId: string;
  readonly type: string;
  readonly revision: number;
  readonly state: string;
  readonly contentHash: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly redirectTo?: { readonly toRelay: string; readonly newKeyId: string };
}

function publicDto(r: StoredRecord): PublicRecordDto {
  return {
    originRelay: r.originRelay, recordId: r.recordId, type: r.type, revision: r.revision, state: r.state, contentHash: r.contentHash, payload: r.envelope.record.payload,
    ...(r.redirectTo ? { redirectTo: r.redirectTo } : {}),
  };
}

/** The exported payload must say what the live listing says: the author cannot publish different terms under its id. */
function assertMatchesListing(payload: Readonly<Record<string, unknown>>, listing: ListingSnapshot): void {
  const price = payload.price as { currency: string; minor: string } | undefined;
  const same =
    payload.title === listing.title && payload.category === listing.category && payload.kind === listing.kind && payload.acceptsBarter === listing.acceptsBarter &&
    payload.regionCell === listing.regionCell && price?.currency === listing.price?.currency && price?.minor === listing.price?.minor;
  if (!same) throw conflict('FEDERATION.LISTING_MISMATCH', 'exported fields differ from the live listing');
}

export function createPortable(env: Env, migration: Migration) {
  const { deps, ports } = env;
  const marks = () => col<FederationMark>(env, COLLECTIONS.marks);
  const records = () => col<StoredRecord>(env, COLLECTIONS.records);

  function rejectCode(reason: RejectReason): never {
    throw validationError(REJECT_CODES[reason], 'record rejected', { reason });
  }

  /** Account opts one record in or out of federation. Opting in needs live federation consent. */
  function applyMark(tenantId: string, accountId: string, recordId: string, federate: boolean): MarkResult {
    const account = ports.accounts.get(accountId);
    if (!account || account.tenantId !== tenantId || account.status !== 'active') throw precondition('FEDERATION.ACCOUNT_UNAVAILABLE', 'account is not active');
    if (federate && !ports.consent.hasConsent(accountId, 'federation')) throw precondition('FEDERATION.CONSENT_REQUIRED', 'federation consent has not been given');
    const listing = ports.listings.get(recordId);
    if (listing && listing.ownerId !== accountId) throw forbidden('FEDERATION.NOT_OWNER', 'you do not own this record');
    const prior = marks().get(recordId);
    if (prior && prior.accountId !== accountId) throw forbidden('FEDERATION.NOT_OWNER', 'you do not own this record');
    const now = deps.clock.now();
    marks().put({ id: recordId, tenantId, accountId, federate, updatedAt: now }, prior?.version ?? 0);
    let withdrawalNeeded = false;
    if (!federate) {
      const published = records().list((r) => r.tenantId === tenantId && r.source === 'local' && r.recordId === recordId && r.state === 'active');
      for (const r of published) cancelPending(env, tenantId, r.id);
      withdrawalNeeded = published.length > 0;
    }
    return { recordId, federate, withdrawalNeeded };
  }

  /** Relay-facing form: acts for `accountId` (for example when a privacy module forwards a consent change). */
  function markFederated(accountId: string, recordId: string, federate: boolean): MarkResult {
    const account = ports.accounts.get(accountId);
    if (!account) throw precondition('FEDERATION.ACCOUNT_UNAVAILABLE', 'account is not active');
    const actor: Actor = { kind: 'user', id: accountId, roles: ['member'], tenantId: account.tenantId };
    return mark({ actor, correlationId: deps.ids.next('cor') }, { recordId, federate });
  }

  function mark(ctx: CommandContext, input: unknown): MarkResult {
    const req = parse(markSchema, input);
    return runCommand(deps, ctx, { name: 'federation.record.mark_federated', flag: FLAGS.portable, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.record:mark', { type: 'federation.record', ownerId: actor.id, tenantId: actor.tenantId });
      const result = applyMark(actor.tenantId, actor.id, req.recordId, req.federate);
      return {
        result,
        events: [{ type: 'federation.record.opt_in_changed', aggregateType: 'record', aggregateId: req.recordId, revision: marks().get(req.recordId)?.version ?? 1, payload: { recordId: req.recordId, accountId: actor.id, federate: req.federate } }],
      };
    });
  }

  /** Shared store step for locally originated records (user publish, label publish, tombstones). */
  function storeLocal(actor: Actor, envelope: FederatedEnvelope, authorAccountId: string | undefined): PublishedDto {
    const { record } = envelope;
    const key = recordKey(record.originRelay, record.recordId);
    const contentHash = hashRecord(record);
    const existing = records().get(key);
    if (existing) {
      if (!migration.isSameAuthor(actor.tenantId, existing.authorKeyId, record.authorKeyId)) rejectCode('author_key_mismatch');
      if (existing.contentHash === contentHash) return { originRelay: record.originRelay, recordId: record.recordId, type: record.type, revision: record.revision, contentHash, queuedFor: 0 };
      // An author never forks its own record: a changed record needs a strictly higher revision.
      if (record.revision <= existing.revision) rejectCode(existing.state === 'tombstoned' ? 'tombstoned' : 'stale_revision');
    }
    const signed = countersign(ports.relay.keys, relayKeyId(env), envelope);
    const stored = records().put(
      {
        id: key, tenantId: actor.tenantId, originRelay: record.originRelay, recordId: record.recordId, type: record.type, revision: record.revision, authorKeyId: record.authorKeyId,
        ...(authorAccountId ? { authorAccountId } : {}), contentHash, envelope: signed, state: record.type === 'tombstone' ? 'tombstoned' : 'active', source: 'local', receivedAt: deps.clock.now(),
        ...(existing?.redirectTo ? { redirectTo: existing.redirectTo } : {}),
      },
      existing?.version ?? 0,
    );
    const queuedFor = enqueueDeliveries(env, actor.tenantId, stored);
    return { originRelay: stored.originRelay, recordId: stored.recordId, type: stored.type, revision: stored.revision, contentHash, queuedFor };
  }

  /** Author-signed record in, relay-countersigned record out. */
  function publish(ctx: CommandContext, input: unknown): PublishedDto {
    const req = parse(publishSchema, input);
    return runCommand(deps, ctx, { name: 'federation.record.publish', flag: FLAGS.portable, request: req }, () => {
      const { actor } = ctx;
      requireProtocolFlags(env, actor.tenantId);
      deps.authz.authorize(actor, 'federation.record:publish', { type: 'federation.record', ownerId: actor.id, tenantId: actor.tenantId });
      const checked = validateEnvelope(req.envelope);
      if (!checked.ok) return rejectCode(checked.error);
      const envelope = checked.value;
      const { record } = envelope;
      if (record.type === 'moderation.label') throw forbidden('FEDERATION.LABEL_RESERVED', 'labels are published by moderators only');
      if (record.originRelay !== ports.relay.relayId) rejectCode('origin_mismatch');
      if (record.createdAt > deps.clock.now() + 5 * 60_000) rejectCode('future_dated');
      const account = ports.accounts.get(actor.id);
      if (!account || account.status !== 'active' || !account.signingKeyIds.includes(record.authorKeyId)) rejectCode('author_key_mismatch');
      if (!verifyAuthor(envelope)) rejectCode('bad_author_signature');
      authorizeOptIn(actor, record.type, record.recordId);
      if (record.type === 'listing.public') {
        const listing = ports.listings.get(record.recordId);
        if (!listing || listing.ownerId !== actor.id || listing.status !== 'published') throw conflict('FEDERATION.LISTING_UNAVAILABLE', 'the listing is not published by you');
        assertMatchesListing(record.payload, listing);
      }
      const existing = records().get(recordKey(record.originRelay, record.recordId));
      if (existing?.authorAccountId !== undefined && existing.authorAccountId !== actor.id) throw forbidden('FEDERATION.NOT_OWNER', 'record belongs to another account');
      const result = storeLocal(actor, envelope, actor.id);
      return {
        result,
        events: existing?.contentHash === result.contentHash ? [] : [{ type: 'federation.record.published', aggregateType: 'record', aggregateId: record.recordId, revision: record.revision, payload: { recordId: record.recordId, type: record.type, revision: record.revision, contentHash: result.contentHash, queuedFor: result.queuedFor } }],
      };
    });
  }

  /** Content needs an active opt-in plus live consent; withdrawing (tombstone) only needs ownership of an existing record. */
  function authorizeOptIn(actor: Actor, type: string, recordId: string): void {
    const m = marks().get(recordId);
    if (type === 'tombstone') {
      if (!records().get(recordKey(ports.relay.relayId, recordId)) || (m && m.accountId !== actor.id)) throw notFound('FEDERATION.RECORD_NOT_FOUND', 'nothing to withdraw');
      return;
    }
    if (!m || m.accountId !== actor.id || !m.federate) throw forbidden('FEDERATION.NOT_OPTED_IN', 'turn federation on for this record first');
    if (!ports.consent.hasConsent(actor.id, 'federation')) throw precondition('FEDERATION.CONSENT_REQUIRED', 'federation consent has not been given');
  }

  /** Moderator label, authored and signed by the relay itself (labels are relay statements, not user content). */
  function publishLabel(ctx: CommandContext, input: unknown): PublishedDto {
    const req = parse(labelSchema, input);
    return runCommand(deps, ctx, { name: 'federation.record.publish_label', flag: FLAGS.portable, request: req }, () => {
      const { actor } = ctx;
      requireProtocolFlags(env, actor.tenantId);
      deps.authz.authorize(actor, 'federation.record:label', { type: 'federation.record', tenantId: actor.tenantId });
      const recordId = req.recordId ?? deps.ids.next('frec');
      const existing = records().get(recordKey(ports.relay.relayId, recordId));
      const record = {
        v: 1 as const, type: 'moderation.label' as const, recordId, revision: (existing?.revision ?? 0) + 1, authorKeyId: keyIdOf(ports.relay.keys.publicKey), originRelay: ports.relay.relayId,
        createdAt: deps.clock.now(), payload: { targetRecordId: req.targetRecordId, label: req.label, severity: req.severity, ...(req.note ? { note: req.note } : {}) },
        ...(existing ? { prevHash: existing.contentHash } : {}),
      };
      const checked = validateEnvelope(signRecord(ports.relay.keys, record));
      if (!checked.ok) return rejectCode(checked.error);
      const result = storeLocal(actor, checked.value, undefined);
      return {
        result,
        events: [{ type: 'federation.record.published', aggregateType: 'record', aggregateId: recordId, revision: record.revision, payload: { recordId, type: record.type, revision: record.revision, contentHash: result.contentHash, queuedFor: result.queuedFor } }],
      };
    });
  }

  /** Portability: everything the account has published, as author-signed envelopes it can take to another relay. */
  function exportOwn(actor: Actor): { envelopes: FederatedEnvelope[] } {
    requireFeature(deps.flags, FLAGS.portable, actor.tenantId);
    deps.authz.authorize(actor, 'federation.record:export', { type: 'federation.record', ownerId: actor.id, tenantId: actor.tenantId });
    const own = records().list((r) => r.tenantId === actor.tenantId && r.source === 'local' && r.authorAccountId === actor.id).sort((a, b) => a.id.localeCompare(b.id));
    return { envelopes: own.map((r) => ({ record: r.envelope.record, authorSig: r.envelope.authorSig })) };
  }

  function getRecord(actor: Actor, input: unknown): PublicRecordDto {
    const req = parse(getSchema, input);
    requireFeature(deps.flags, FLAGS.portable, actor.tenantId);
    deps.authz.authorize(actor, 'federation.record:read', { type: 'federation.record', tenantId: actor.tenantId });
    const r = records().get(recordKey(req.originRelay, req.recordId));
    if (!r || r.tenantId !== actor.tenantId) throw notFound('FEDERATION.RECORD_NOT_FOUND', 'record not found');
    return publicDto(r);
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.record.mark_federated', kind: 'command', flag: FLAGS.portable, summary: 'Opt a record in or out of federation', handler: mark },
    { name: 'federation.record.publish', kind: 'command', flag: FLAGS.portable, summary: 'Publish an author-signed record to federation', handler: publish },
    { name: 'federation.record.publish_label', kind: 'command', flag: FLAGS.portable, summary: 'Moderator: publish a relay-signed moderation label', handler: publishLabel },
    { name: 'federation.record.export', kind: 'query', flag: FLAGS.portable, summary: 'Export my federated records, author-signed', handler: (ctx) => exportOwn(ctx.actor) },
    { name: 'federation.record.get', kind: 'query', flag: FLAGS.portable, summary: 'Read a federated public record', public: true, handler: (ctx, input) => getRecord(ctx.actor, input) },
  ]);

  return { markFederated, publish, publishLabel, exportOwn, getRecord, operations };
}
