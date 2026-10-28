/**
 * F11.S03.M01 trust: registry of peer relays. A peer moves pending -> trusted -> suspended -> blocked under
 * operator control; its public key is pinned at registration and changes only through an explicit rotation that
 * resets trust. Per-peer inbound rate limits, daily byte quotas and rejection counters are enforced on receive.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, DAY, defineOperations, MINUTE, notFound, parse, rateLimited, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import { keyIdSchema, relayIdSchema } from '../protocol/records';
import type { Peer, PeerLimits, PeerStats, PeerStatus } from '../types';
import type { Env } from '../support';
import { AUTO_SUSPEND_AFTER, col, COLLECTIONS, DEFAULT_LIMITS, FLAGS } from '../support';

const TRANSITIONS: Readonly<Record<PeerStatus, readonly PeerStatus[]>> = {
  pending: ['trusted', 'blocked'],
  trusted: ['suspended', 'blocked'],
  suspended: ['trusted', 'blocked'],
  blocked: ['pending'],
};

const limitsSchema = z.strictObject({ recordsPerMinute: z.number().int().min(1).max(100_000), dailyByteQuota: z.number().int().min(1024).max(2 ** 40) });
const registerSchema = z.strictObject({ relayId: relayIdSchema, publicKeyId: keyIdSchema, name: schemas.text(1, 80).optional(), limits: limitsSchema.optional() });
const peerRef = z.strictObject({ peerId: schemas.id('peer'), expectedVersion: z.number().int().min(0).optional() });
const transitionSchema = peerRef.extend({ status: z.enum(['pending', 'trusted', 'suspended', 'blocked']) });
const rotateSchema = peerRef.extend({ publicKeyId: keyIdSchema });
const limitsUpdateSchema = peerRef.extend({ limits: limitsSchema });
const getSchema = z.strictObject({ peerId: schemas.id('peer') });

export interface PeerDto {
  readonly id: string;
  readonly relayId: string;
  readonly name?: string;
  readonly publicKeyId: string;
  readonly status: PeerStatus;
  readonly limits: PeerLimits;
  readonly version: number;
  readonly reputation: { readonly accepted: number; readonly rejected: number; readonly duplicates: number; readonly consecutiveRejections: number; readonly rejectionsByReason: Readonly<Record<string, number>> };
}

const emptyStats = (tenantId: string, id: string, now: number): PeerStats => ({
  id, version: 0, tenantId, accepted: 0, rejected: 0, duplicates: 0, consecutiveRejections: 0, rejectionsByReason: {}, minuteStart: now, minuteRecords: 0, dayStart: now, dayBytes: 0,
});

export function createTrust(env: Env) {
  const { deps } = env;
  const peers = () => col<Peer>(env, COLLECTIONS.peers);
  const stats = () => col<PeerStats>(env, COLLECTIONS.peerStats);

  const dto = (p: Peer): PeerDto => {
    const s = stats().get(p.id);
    return {
      id: p.id, relayId: p.relayId, publicKeyId: p.publicKeyId, status: p.status, limits: p.limits, version: p.version, ...(p.name ? { name: p.name } : {}),
      reputation: { accepted: s?.accepted ?? 0, rejected: s?.rejected ?? 0, duplicates: s?.duplicates ?? 0, consecutiveRejections: s?.consecutiveRejections ?? 0, rejectionsByReason: s?.rejectionsByReason ?? {} },
    };
  };

  const peerEvent = (type: string, p: Peer, extra: Record<string, string | number> = {}) => ({
    type, aggregateType: 'peer', aggregateId: p.id, revision: p.version, payload: { peerId: p.id, relayId: p.relayId, status: p.status, ...extra },
  });

  function manage(actor: Actor): void {
    deps.authz.authorize(actor, 'federation.peer:manage', { type: 'federation.peer', tenantId: actor.tenantId });
  }

  function loadPeer(actor: Actor, peerId: string): Peer {
    const peer = peers().get(peerId);
    if (!peer || peer.tenantId !== actor.tenantId) throw notFound('FEDERATION.PEER_NOT_FOUND', 'peer not found');
    return peer;
  }

  function register(ctx: CommandContext, input: unknown): PeerDto {
    const req = parse(registerSchema, input);
    return runCommand(deps, ctx, { name: 'federation.peer.register', flag: FLAGS.trust, request: req }, () => {
      const { actor } = ctx;
      manage(actor);
      if (req.relayId === env.ports.relay.relayId) throw conflict('FEDERATION.PEER_SELF', 'a relay cannot peer with itself');
      if (peers().count((p) => p.tenantId === actor.tenantId && p.relayId === req.relayId) > 0) throw conflict('FEDERATION.PEER_EXISTS', 'peer already registered');
      const now = deps.clock.now();
      const saved = peers().put(
        {
          id: deps.ids.next('peer'), tenantId: actor.tenantId, relayId: req.relayId, publicKeyId: req.publicKeyId, status: 'pending', limits: req.limits ?? DEFAULT_LIMITS,
          createdAt: now, updatedAt: now, ...(req.name ? { name: req.name } : {}),
        },
        0,
      );
      stats().put(emptyStats(actor.tenantId, saved.id, now), 0);
      return { result: dto(saved), events: [peerEvent('federation.peer.registered', saved)] };
    });
  }

  function transition(ctx: CommandContext, input: unknown): PeerDto {
    const req = parse(transitionSchema, input);
    return runCommand(deps, ctx, { name: 'federation.peer.transition', flag: FLAGS.trust, request: req }, () => {
      const { actor } = ctx;
      manage(actor);
      const peer = loadPeer(actor, req.peerId);
      assertTransition('FEDERATION_PEER', peer.status, req.status, TRANSITIONS);
      assertVersion('peer', peer.version, req.expectedVersion);
      const saved = peers().put({ ...peer, status: req.status, updatedAt: deps.clock.now() }, peer.version);
      return { result: dto(saved), events: [peerEvent('federation.peer.status_changed', saved, { from: peer.status })] };
    });
  }

  /** Re-pinning a key is a trust decision: the peer goes back to pending until an operator re-approves it. */
  function rotateKey(ctx: CommandContext, input: unknown): PeerDto {
    const req = parse(rotateSchema, input);
    return runCommand(deps, ctx, { name: 'federation.peer.rotate_key', flag: FLAGS.trust, request: req }, () => {
      const { actor } = ctx;
      manage(actor);
      const peer = loadPeer(actor, req.peerId);
      if (peer.status === 'blocked') throw conflict('FEDERATION.PEER_BLOCKED', 'unblock the peer before changing its key');
      assertVersion('peer', peer.version, req.expectedVersion);
      const saved = peers().put({ ...peer, publicKeyId: req.publicKeyId, status: 'pending', updatedAt: deps.clock.now() }, peer.version);
      return { result: dto(saved), events: [peerEvent('federation.peer.key_rotated', saved)] };
    });
  }

  function setLimits(ctx: CommandContext, input: unknown): PeerDto {
    const req = parse(limitsUpdateSchema, input);
    return runCommand(deps, ctx, { name: 'federation.peer.set_limits', flag: FLAGS.trust, request: req }, () => {
      const { actor } = ctx;
      manage(actor);
      const peer = loadPeer(actor, req.peerId);
      assertVersion('peer', peer.version, req.expectedVersion);
      const saved = peers().put({ ...peer, limits: req.limits, updatedAt: deps.clock.now() }, peer.version);
      return { result: dto(saved), events: [peerEvent('federation.peer.limits_changed', saved, { recordsPerMinute: saved.limits.recordsPerMinute })] };
    });
  }

  function get(actor: Actor, input: unknown): PeerDto {
    const req = parse(getSchema, input);
    requireFeature(deps.flags, FLAGS.trust, actor.tenantId);
    manage(actor);
    return dto(loadPeer(actor, req.peerId));
  }

  function list(actor: Actor): { peers: PeerDto[] } {
    requireFeature(deps.flags, FLAGS.trust, actor.tenantId);
    manage(actor);
    return { peers: peers().list((p) => p.tenantId === actor.tenantId).sort((a, b) => a.id.localeCompare(b.id)).map(dto) };
  }

  const byRelay = (tenantId: string, relayId: string): Peer | undefined => peers().list((p) => p.tenantId === tenantId && p.relayId === relayId)[0];

  /** Inbound admission: window counters are only read here; they are committed by `commitTraffic` after processing. */
  function admit(peer: Peer, records: number, bytes: number): void {
    const now = deps.clock.now();
    const s = stats().get(peer.id) ?? emptyStats(peer.tenantId, peer.id, now);
    const minuteRecords = now - s.minuteStart >= MINUTE ? 0 : s.minuteRecords;
    const dayBytes = now - s.dayStart >= DAY ? 0 : s.dayBytes;
    if (minuteRecords + records > peer.limits.recordsPerMinute) throw rateLimited('FEDERATION.PEER_RATE_LIMITED', 'peer exceeded its inbound record rate');
    if (dayBytes + bytes > peer.limits.dailyByteQuota) throw rateLimited('FEDERATION.PEER_QUOTA_EXCEEDED', 'peer exceeded its daily byte quota');
  }

  interface TrafficOutcome {
    readonly records: number;
    readonly bytes: number;
    readonly accepted: number;
    readonly duplicates: number;
    readonly rejected: readonly string[];
  }

  /** Persists traffic windows and reputation counters; suspends a trusted peer after a long run of rejections. */
  function commitTraffic(peer: Peer, outcome: TrafficOutcome): { suspended: Peer | undefined } {
    const now = deps.clock.now();
    const s = stats().get(peer.id) ?? emptyStats(peer.tenantId, peer.id, now);
    const minuteExpired = now - s.minuteStart >= MINUTE;
    const dayExpired = now - s.dayStart >= DAY;
    const byReason: Record<string, number> = { ...s.rejectionsByReason };
    for (const reason of outcome.rejected) byReason[reason] = (byReason[reason] ?? 0) + 1;
    const consecutive = outcome.rejected.length > 0 && outcome.accepted === 0 ? s.consecutiveRejections + outcome.rejected.length : outcome.accepted > 0 ? 0 : s.consecutiveRejections;
    stats().put(
      {
        ...s, accepted: s.accepted + outcome.accepted, rejected: s.rejected + outcome.rejected.length, duplicates: s.duplicates + outcome.duplicates,
        consecutiveRejections: consecutive, rejectionsByReason: byReason,
        minuteStart: minuteExpired ? now : s.minuteStart, minuteRecords: (minuteExpired ? 0 : s.minuteRecords) + outcome.records,
        dayStart: dayExpired ? now : s.dayStart, dayBytes: (dayExpired ? 0 : s.dayBytes) + outcome.bytes,
      },
      s.version,
    );
    if (peer.status === 'trusted' && consecutive >= AUTO_SUSPEND_AFTER) {
      return { suspended: peers().put({ ...peer, status: 'suspended', updatedAt: now }, peer.version) };
    }
    return { suspended: undefined };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.peer.register', kind: 'command', flag: FLAGS.trust, summary: 'Register a peer relay with a pinned key (starts pending)', handler: register },
    { name: 'federation.peer.transition', kind: 'command', flag: FLAGS.trust, summary: 'Move a peer between pending, trusted, suspended and blocked', handler: transition },
    { name: 'federation.peer.rotate_key', kind: 'command', flag: FLAGS.trust, summary: 'Re-pin a peer key (resets trust to pending)', handler: rotateKey },
    { name: 'federation.peer.set_limits', kind: 'command', flag: FLAGS.trust, summary: 'Set per-peer rate limit and byte quota', handler: setLimits },
    { name: 'federation.peer.get', kind: 'query', flag: FLAGS.trust, summary: 'Read a peer with its reputation counters', handler: (ctx, input) => get(ctx.actor, input) },
    { name: 'federation.peer.list', kind: 'query', flag: FLAGS.trust, summary: 'List peers', handler: (ctx) => list(ctx.actor) },
  ]);

  return { register, transition, rotateKey, setLimits, get, list, byRelay, admit, commitTraffic, operations };
}

export type Trust = ReturnType<typeof createTrust>;
