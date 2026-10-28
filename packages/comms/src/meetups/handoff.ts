/**
 * F08.S03.M02 handoff: arrival check-ins, receiver-generated 6-digit confirmation codes, and the
 * trusted-contact share link. The relay stores only a salted hash of the code and counts wrong attempts.
 * A confirmed code is bilateral evidence that giver and receiver met and agreed; it is not proof that goods or
 * money changed hands and never settles a payment.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { conflict, defineOperations, HOUR, MINUTE, notFound, parse, precondition, requireFeature, runCommand, schemas, validationError, z } from '@classrup/kernel';
import { hashToken, randomToken, timingSafeEqual, utf8 } from '@classrup/security';
import { handoffCodeHash } from '../client';
import { hashSchema } from '../schemas';
import type { Env } from '../support';
import { col, COLLECTIONS, FLAGS, notifyEach } from '../support';
import type { Handoff, Meetup, MeetupState, SafeSpot, SafetyShare } from '../types';
import type { Coordination } from './coordination';

export const CHECK_IN_GRACE_MS = 30 * MINUTE;
export const CODE_TTL_MS = 30 * MINUTE;
export const MAX_CODE_TTL_MS = 2 * HOUR;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_SHARE_TTL_MS = 48 * HOUR;
const MAX_SHARES_PER_MEETUP = 5;
/** The response of `share` carries a bearer token, so its idempotent replay window is kept short. */
const SHARE_IDEMPOTENCY_TTL_MS = 5 * MINUTE;

const meetupRef = z.strictObject({ meetupId: schemas.id('mtp') });
const setCodeSchema = meetupRef.extend({ codeHash: hashSchema, ttlMs: z.number().int().min(MINUTE).max(MAX_CODE_TTL_MS).default(CODE_TTL_MS) });
const confirmSchema = meetupRef.extend({ code: z.string().regex(/^\d{6}$/) });
const shareSchema = meetupRef.extend({ ttlMs: z.number().int().min(MINUTE).max(MAX_SHARE_TTL_MS).optional() });
const viewShareSchema = z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
const revokeSchema = z.strictObject({ shareId: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
const listSharesSchema = meetupRef;

export type ConfirmOutcome = 'confirmed' | 'wrong_code' | 'locked' | 'expired';

export interface ConfirmResult {
  readonly meetupId: string;
  readonly outcome: ConfirmOutcome;
  readonly attemptsLeft?: number;
  readonly confirmedAt?: number;
}

export interface SharedMeetupView {
  readonly state: MeetupState;
  readonly window: { readonly startsAt: number; readonly endsAt: number };
  /** Name of the public safe spot, or null when the meetup is at a private place (which is never revealed). */
  readonly safeSpotName: string | null;
}

export function createHandoff(env: Env, coordination: Coordination) {
  const { deps } = env;
  const handoffs = () => col<Handoff>(env, COLLECTIONS.handoffs);
  const shares = () => col<SafetyShare>(env, COLLECTIONS.shares);
  const spots = () => col<SafeSpot>(env, COLLECTIONS.safeSpots);

  function participantRef(m: Meetup) {
    return { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds };
  }

  function checkIn(ctx: CommandContext, input: unknown): { meetupId: string; arrivedAt: number } {
    const req = parse(meetupRef, input);
    return runCommand(deps, ctx, { name: 'comms.handoff.check_in', flag: FLAGS.handoff, request: req }, () => {
      const { actor } = ctx;
      const m = coordination.loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.handoff:checkin', participantRef(m));
      const now = deps.clock.now();
      if (m.state !== 'confirmed') throw conflict('COMMS.HANDOFF_STATE', 'check-in needs a confirmed meetup', { state: m.state });
      if (now < m.window.startsAt - CHECK_IN_GRACE_MS || now > m.window.endsAt + CHECK_IN_GRACE_MS) {
        throw precondition('COMMS.CHECK_IN_WINDOW', 'check-in is only possible around the meetup window');
      }
      const prior = m.arrivals[actor.id];
      if (prior !== undefined) return { result: { meetupId: m.id, arrivedAt: prior } };
      const saved = col<Meetup>(env, COLLECTIONS.meetups).put({ ...m, arrivals: { ...m.arrivals, [actor.id]: now }, updatedAt: now }, m.version);
      notifyEach(env, actor.tenantId, m.participantIds.filter((id) => id !== actor.id), 'comms.handoff', 'comms.handoff.arrived', { meetupId: m.id, threadId: m.threadId });
      return {
        result: { meetupId: m.id, arrivedAt: now },
        events: [{ type: 'comms.handoff.checked_in', aggregateType: 'meetup', aggregateId: m.id, revision: saved.version, payload: { meetupId: m.id, accountId: actor.id, at: now, claim: 'self_reported' } }],
      };
    });
  }

  /** Receiver publishes the hash of a code they generated on their device and will show the giver in person. */
  function setCode(ctx: CommandContext, input: unknown): { meetupId: string; expiresAt: number } {
    const req = parse(setCodeSchema, input);
    return runCommand(deps, ctx, { name: 'comms.handoff.set_code', flag: FLAGS.handoff, request: req }, () => {
      const { actor } = ctx;
      const m = coordination.loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.handoff:code', participantRef(m));
      if (m.state !== 'confirmed') throw conflict('COMMS.HANDOFF_STATE', 'a code needs a confirmed meetup', { state: m.state });
      const prior = handoffs().get(m.id);
      if (prior?.status === 'confirmed') throw conflict('COMMS.HANDOFF_STATE', 'handoff already confirmed');
      if (prior && prior.receiverId !== actor.id && prior.status === 'pending') throw conflict('COMMS.HANDOFF_STATE', 'another participant already holds the receiver role');
      const expiresAt = deps.clock.now() + req.ttlMs;
      const next = { id: m.id, tenantId: m.tenantId, meetupId: m.id, meetupRevision: m.revision, receiverId: actor.id, codeHash: req.codeHash, expiresAt, failedAttempts: 0, status: 'pending' as const };
      handoffs().put(next, prior?.version ?? 0);
      return { result: { meetupId: m.id, expiresAt } };
    });
  }

  /**
   * The giver enters the code. Wrong attempts are persisted, so this never throws for a wrong code:
   * it returns the outcome and the failed-attempt counter survives the call.
   */
  function confirm(ctx: CommandContext, input: unknown): ConfirmResult {
    const req = parse(confirmSchema, input);
    // The raw code must not reach the idempotency fingerprint stored by the pipeline.
    const request = { meetupId: req.meetupId, codeHash: handoffCodeHash(req.meetupId, req.code) };
    return runCommand<ConfirmResult>(deps, ctx, { name: 'comms.handoff.confirm', flag: FLAGS.handoff, request }, () => {
      const { actor } = ctx;
      const m = coordination.loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.handoff:confirm', participantRef(m));
      const h = handoffs().get(m.id);
      if (!h) throw precondition('COMMS.HANDOFF_NO_CODE', 'the receiver has not created a code yet');
      if (h.receiverId === actor.id) throw validationError('COMMS.HANDOFF_ROLE', 'the receiver cannot confirm their own code');
      if (m.state !== 'confirmed' || h.status === 'confirmed') throw conflict('COMMS.HANDOFF_STATE', 'handoff cannot be confirmed in the current state', { state: m.state });
      const now = deps.clock.now();
      if (h.status === 'locked') return { result: { meetupId: m.id, outcome: 'locked' } };
      if (now > h.expiresAt || h.meetupRevision !== m.revision) return { result: { meetupId: m.id, outcome: 'expired' } };
      if (timingSafeEqual(utf8(request.codeHash), utf8(h.codeHash))) {
        handoffs().put({ ...h, status: 'confirmed', confirmedBy: actor.id, confirmedAt: now }, h.version);
        const saved = coordination.move(m, 'completed', {});
        return {
          result: { meetupId: m.id, outcome: 'confirmed', confirmedAt: now },
          events: [
            {
              type: 'comms.handoff.confirmed_by_code', aggregateType: 'meetup', aggregateId: m.id, revision: saved.version,
              payload: { meetupId: m.id, threadId: m.threadId, receiverId: h.receiverId, giverId: actor.id, confirmedAt: now, evidence: 'bilateral_code' },
            },
          ],
        };
      }
      const failedAttempts = h.failedAttempts + 1;
      const locked = failedAttempts >= MAX_CODE_ATTEMPTS;
      const saved = handoffs().put({ ...h, failedAttempts, status: locked ? 'locked' : 'pending' }, h.version);
      return {
        result: { meetupId: m.id, outcome: locked ? 'locked' : 'wrong_code', ...(locked ? {} : { attemptsLeft: MAX_CODE_ATTEMPTS - failedAttempts }) },
        events: [{ type: 'comms.handoff.code_rejected', aggregateType: 'handoff', aggregateId: saved.id, revision: saved.version, payload: { meetupId: m.id, attempts: failedAttempts, locked } }],
      };
    });
  }

  /** Mints a bearer token for a trusted contact. Only its hash is stored; the token is shown once. */
  function share(ctx: CommandContext, input: unknown): { shareId: string; token: string; expiresAt: number } {
    const req = parse(shareSchema, input);
    return runCommand(deps, ctx, { name: 'comms.safety.share', flag: FLAGS.handoff, request: req, idempotencyTtlMs: SHARE_IDEMPOTENCY_TTL_MS }, () => {
      const { actor } = ctx;
      const m = coordination.loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.safety:share', participantRef(m));
      if (m.state !== 'proposed' && m.state !== 'confirmed') throw conflict('COMMS.HANDOFF_STATE', 'a share link needs an open meetup', { state: m.state });
      const now = deps.clock.now();
      const mine = shares().count((s) => s.meetupId === m.id && s.createdBy === actor.id && !s.revoked && s.expiresAt > now);
      if (mine >= MAX_SHARES_PER_MEETUP) throw conflict('COMMS.SHARE_QUOTA', 'too many active share links');
      const token = randomToken();
      const expiresAt = Math.min(now + (req.ttlMs ?? MAX_SHARE_TTL_MS), m.window.endsAt + 2 * HOUR);
      const saved = shares().put({ id: hashToken(token), tenantId: m.tenantId, meetupId: m.id, createdBy: actor.id, expiresAt, revoked: false, createdAt: now }, 0);
      return {
        result: { shareId: saved.id, token, expiresAt },
        events: [{ type: 'comms.safety.shared', aggregateType: 'safety_share', aggregateId: saved.id, revision: saved.version, payload: { meetupId: m.id, createdBy: actor.id, expiresAt } }],
      };
    });
  }

  /** Public, token-authenticated. Reveals window, state and the public safe-spot name, nothing else. */
  function viewShare(actor: Actor, input: unknown): SharedMeetupView {
    const req = parse(viewShareSchema, input);
    requireFeature(deps.flags, FLAGS.handoff, actor.tenantId);
    deps.authz.authorize(actor, 'comms.safety:view_share', { type: 'comms.safety', tenantId: actor.tenantId });
    const s = shares().get(hashToken(req.token));
    const m = s && s.tenantId === actor.tenantId ? col<Meetup>(env, COLLECTIONS.meetups).get(s.meetupId) : undefined;
    if (!s || !m || s.revoked || s.expiresAt <= deps.clock.now()) throw notFound('COMMS.SHARE_NOT_FOUND', 'share link not found or expired');
    return {
      state: m.state,
      window: { startsAt: m.window.startsAt, endsAt: m.window.endsAt },
      safeSpotName: m.place.kind === 'safe_spot' ? (spots().get(m.place.safeSpotId)?.name ?? null) : null,
    };
  }

  function revokeShare(ctx: CommandContext, input: unknown): { shareId: string; revoked: true } {
    const req = parse(revokeSchema, input);
    return runCommand(deps, ctx, { name: 'comms.safety.revoke_share', flag: FLAGS.handoff, request: req }, () => {
      const { actor } = ctx;
      const s = shares().get(req.shareId);
      if (!s || s.tenantId !== actor.tenantId) throw notFound('COMMS.SHARE_NOT_FOUND', 'share link not found');
      deps.authz.authorize(actor, 'comms.safety:revoke_share', { type: 'comms.safety', id: s.id, ownerId: s.createdBy, tenantId: s.tenantId });
      if (s.revoked) return { result: { shareId: s.id, revoked: true as const } };
      const saved = shares().put({ ...s, revoked: true }, s.version);
      return {
        result: { shareId: saved.id, revoked: true as const },
        events: [{ type: 'comms.safety.share_revoked', aggregateType: 'safety_share', aggregateId: saved.id, revision: saved.version, payload: { meetupId: saved.meetupId } }],
      };
    });
  }

  function listShares(actor: Actor, input: unknown): { shares: { shareId: string; expiresAt: number; revoked: boolean }[] } {
    const req = parse(listSharesSchema, input);
    requireFeature(deps.flags, FLAGS.handoff, actor.tenantId);
    const m = coordination.loadMeetup(actor, req.meetupId);
    deps.authz.authorize(actor, 'comms.safety:share', participantRef(m));
    return { shares: shares().list((s) => s.meetupId === m.id && s.createdBy === actor.id).map((s) => ({ shareId: s.id, expiresAt: s.expiresAt, revoked: s.revoked })) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.handoff.check_in', kind: 'command', flag: FLAGS.handoff, summary: 'Claim arrival at the meetup', handler: checkIn },
    { name: 'comms.handoff.set_code', kind: 'command', flag: FLAGS.handoff, summary: 'Receiver: publish the hash of a handoff code', handler: setCode },
    { name: 'comms.handoff.confirm', kind: 'command', flag: FLAGS.handoff, summary: 'Giver: confirm the handoff with the receiver code', handler: confirm },
    { name: 'comms.safety.share', kind: 'command', flag: FLAGS.handoff, summary: 'Create a trusted-contact share link', handler: share },
    { name: 'comms.safety.view_share', kind: 'query', flag: FLAGS.handoff, summary: 'Trusted contact: view window and safe-spot name', public: true, handler: (ctx, input) => viewShare(ctx.actor, input) },
    { name: 'comms.safety.revoke_share', kind: 'command', flag: FLAGS.handoff, summary: 'Revoke a share link', handler: revokeShare },
    { name: 'comms.safety.list_shares', kind: 'query', flag: FLAGS.handoff, summary: 'List my share links for a meetup', handler: (ctx, input) => listShares(ctx.actor, input) },
  ]);

  return { checkIn, setCode, confirm, share, viewShare, revokeShare, listShares, operations };
}
