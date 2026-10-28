/**
 * @classrup/federation (F11): opt-in, signed, portable federation of public records between independently
 * operated relays. Records are signed by their author and countersigned by their origin relay; peers are pinned,
 * rate limited and revocable; nothing private or exact ever enters a federated payload.
 *
 * Relay wiring notes (no event subscriptions live in this package):
 * - Schedule the system commands `federation.delivery.send_due` (for example every 30s) and
 *   `federation.sync.purge_expired` (hourly) with a system actor.
 * - Mount `federation.sync.receive` on the peer-facing endpoint with an actor of kind `relay`.
 * - Listing changes: after `bazaar` updates a published listing whose owner opted in, the client re-signs a new
 *   revision and calls `federation.record.publish`; listing removal maps to a signed tombstone.
 * - Consume `federation.record.imported` / `federation.record.tombstoned` events and read the record through
 *   `federation.record.get` (or `federation.portable.getRecord`) to index remote content.
 */
import type { Deps, ModuleDescriptor, Operation } from '@classrup/kernel';
import { defineModules, defineOperations } from '@classrup/kernel';
import type { Actor } from '@classrup/kernel';
import type { PolicyRule } from '@classrup/security';
import { anyOf, anyone, authenticated, hasAnyRole, isSystem } from '@classrup/security';
import { createBlocklists } from './interop/blocklists';
import { createMigration } from './interop/migration';
import { createTrust } from './interop/trust';
import type { FederationPorts } from './ports';
import { resolvePorts } from './ports';
import { createPortable } from './protocol/portable';
import { createDelivery } from './sync/delivery';
import { createInbound } from './sync/inbound';
import type { Env } from './support';
import { COLLECTIONS, FLAGS } from './support';

export * from './protocol/signatures';
export { scanPrivacy, validateEnvelope, hashRecord } from './protocol/records';
export type { RejectReason, PrivacyFinding } from './protocol/records';
export { rank, resolve, classify } from './sync/conflicts';
export type { Contender, Winner } from './sync/conflicts';
export { backoffMs } from './sync/delivery';
export { CollectionNonceStore } from './sync/dedup';
export type { FederationPorts, FederationTransportPort, ConsentPort, RelayIdentity, SendResult, PeerRef } from './ports';
export type * from './types';
export type { PublishedDto, PublicRecordDto, MarkResult } from './protocol/portable';
export type { ReceiveResult, RecordResult, RecordOutcome } from './sync/inbound';
export type { PeerDto } from './interop/trust';
export type { BlockDto, BlocklistPayload } from './interop/blocklists';
export type { MigrationDto } from './interop/migration';
export type { DeliveryDto } from './sync/delivery';

export function createFederation(deps: Deps, ports: FederationPorts) {
  const env: Env = { deps, ports: resolvePorts(ports) };
  const trust = createTrust(env);
  const blocklists = createBlocklists(env);
  const migration = createMigration(env);
  const portable = createPortable(env, migration);
  const delivery = createDelivery(env);
  const inbound = createInbound(env, trust, blocklists, migration);

  const operations: readonly Operation[] = defineOperations([
    ...portable.operations,
    ...delivery.operations,
    ...inbound.operations,
    ...trust.operations,
    ...blocklists.operations,
    ...migration.operations,
  ]);

  return {
    operations,
    portable,
    delivery,
    inbound,
    trust,
    blocklists,
    migration,
    /** Opt a record in or out of federation on behalf of `accountId` (consent is checked via the consent port). */
    markFederated: portable.markFederated,
    /** Ingest a peer batch; the relay's peer endpoint calls this with a `relay` actor. */
    receive: inbound.receive,
    /** True if `actor` may act as a federation peer endpoint. */
    isPeerActor: (actor: Actor): boolean => actor.kind === 'relay',
  };
}

export type Federation = ReturnType<typeof createFederation>;

const admin = hasAnyRole('admin');
const peerEndpoint = anyOf(isSystem, (a: Actor) => a.kind === 'relay');

export const POLICIES: readonly PolicyRule[] = [
  { permission: 'federation.record:mark', allow: authenticated, description: 'Opt your own record in or out of federation' },
  { permission: 'federation.record:publish', allow: authenticated, description: 'Publish your own author-signed record' },
  { permission: 'federation.record:export', allow: authenticated, description: 'Export your own federated records' },
  { permission: 'federation.record:read', allow: anyone, public: true, description: 'Read federated public records' },
  { permission: 'federation.record:label', allow: hasAnyRole('moderator', 'admin'), description: 'Publish relay-signed moderation labels' },
  { permission: 'federation.sync:receive', allow: peerEndpoint, description: 'Peer endpoint ingests a signed batch' },
  { permission: 'federation.sync:purge', allow: isSystem, description: 'System purges expired replay data' },
  { permission: 'federation.delivery:send', allow: isSystem, description: 'System sweeper sends due batches' },
  { permission: 'federation.delivery:manage', allow: admin, description: 'Operators inspect and requeue deliveries' },
  { permission: 'federation.peer:manage', allow: admin, description: 'Operators manage peer relays' },
  { permission: 'federation.blocklist:manage', allow: admin, description: 'Operators manage blocklists' },
  { permission: 'federation.migration:submit', allow: authenticated, description: 'Submit a dual-signed migration statement' },
  { permission: 'federation.migration:administer', allow: admin, description: 'Operators submit migrations for others' },
  { permission: 'federation.migration:resolve', allow: anyone, public: true, description: 'Look up where an author key moved' },
];

const C = COLLECTIONS;

export const MODULES: readonly ModuleDescriptor[] = defineModules([
  {
    id: 'F11.S01.M01', path: '11_Federation/01_protocol/mod_portable', flag: FLAGS.portable,
    summary: 'Explicit per-record federation opt-in with live consent, author-signed publishing, relay countersigning and account export',
    permissions: ['federation.record:mark', 'federation.record:publish', 'federation.record:export', 'federation.record:read', 'federation.record:label'],
    events: ['federation.record.opt_in_changed', 'federation.record.published'],
    collections: [C.marks, C.records],
  },
  {
    id: 'F11.S01.M02', path: '11_Federation/01_protocol/mod_records', flag: FLAGS.records,
    summary: 'FederatedRecord envelope v1, per-type payload schemas, 32KB limit and privacy assertions (no coordinates, addresses or contact keys)',
    permissions: [],
    events: [],
    collections: [],
  },
  {
    id: 'F11.S01.M03', path: '11_Federation/01_protocol/mod_signatures', flag: FLAGS.signatures,
    summary: 'Author Ed25519 signatures, origin-relay countersignatures and signed transport batches with domain-separated contexts',
    permissions: [],
    events: [],
    collections: [],
  },
  {
    id: 'F11.S02.M01', path: '11_Federation/02_relay_sync/mod_delivery', flag: FLAGS.delivery,
    summary: 'Per-peer outbox, 100-record signed batches, exponential backoff with jitter, dead letters after 8 attempts',
    permissions: ['federation.delivery:send', 'federation.delivery:manage'],
    events: ['federation.delivery.sent', 'federation.delivery.retry_scheduled', 'federation.delivery.dead_lettered', 'federation.delivery.requeued'],
    collections: [C.deliveries],
  },
  {
    id: 'F11.S02.M02', path: '11_Federation/02_relay_sync/mod_dedup', flag: FLAGS.dedup,
    summary: 'Inbound batch pipeline: pinned-key authentication, persistent replay guard, duplicate registry, idempotent import',
    permissions: ['federation.sync:receive', 'federation.sync:purge'],
    events: ['federation.record.imported', 'federation.record.tombstoned', 'federation.record.rejected'],
    collections: [C.nonces, C.seen],
  },
  {
    id: 'F11.S02.M03', path: '11_Federation/02_relay_sync/mod_conflicts', flag: FLAGS.conflicts,
    summary: 'Deterministic order-independent resolution: revision, tombstone precedence, smaller hash tie-break, author-key continuity, conflict log',
    permissions: [],
    events: ['federation.conflict.recorded'],
    collections: [C.conflicts],
  },
  {
    id: 'F11.S03.M01', path: '11_Federation/03_interop/mod_trust', flag: FLAGS.trust,
    summary: 'Peer registry pending/trusted/suspended/blocked with key pinning, inbound rate limits, byte quotas and rejection counters',
    permissions: ['federation.peer:manage'],
    events: ['federation.peer.registered', 'federation.peer.status_changed', 'federation.peer.key_rotated', 'federation.peer.limits_changed'],
    collections: [C.peers, C.peerStats],
  },
  {
    id: 'F11.S03.M02', path: '11_Federation/03_interop/mod_blocklists', flag: FLAGS.blocklists,
    summary: 'Peer, domain and author-key blocklists; signed imports from trusted peers enter an operator review queue',
    permissions: ['federation.blocklist:manage'],
    events: ['federation.blocklist.added', 'federation.blocklist.removed', 'federation.blocklist.reviewed', 'federation.blocklist.imported'],
    collections: [C.blocks],
  },
  {
    id: 'F11.S03.M03', path: '11_Federation/03_interop/mod_migration', flag: FLAGS.migration,
    summary: 'Dual-signed account migration statements, successor-key acceptance, redirect tombstones on the old relay',
    permissions: ['federation.migration:submit', 'federation.migration:administer', 'federation.migration:resolve'],
    events: ['federation.migration.verified'],
    collections: [C.migrations],
  },
]);
