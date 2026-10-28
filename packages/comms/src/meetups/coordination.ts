/**
 * F08.S03.M03 meetup coordination: propose / accept / counter / reschedule / cancel, plus no-show claims.
 * Every material change (window or place) makes a new revision that all participants must accept again.
 * A private place is sealed to the participants' box keys; the relay stores only ciphertext for it.
 * Confirmation, check-ins and no-show reports are claims by participants, not independent verification.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, defineOperations, HOUR, DAY, notFound, parse, precondition, requireFeature, runCommand, schemas, validationError, z } from '@classrup/kernel';
import type { MultiRecipientCiphertext } from '@classrup/security';
import { accountIdSchema, ciphertextSchema, threadIdSchema } from '../schemas';
import type { Env } from '../support';
import { assertKeysMatch, assertNotBlocked, authorizeThread, col, COLLECTIONS, FLAGS, loadThread, notifyEach, resolveRecipientKeys, trimCiphertext, withStatus } from '../support';
import type { Meetup, MeetupPlace, MeetupState, MeetupWindow, NoShowClaim, SafeSpot } from '../types';

export const MAX_WINDOW_MS = 12 * HOUR;
export const MAX_LEAD_MS = 30 * DAY;
const MAX_MEETUP_PARTICIPANTS = 6;

const TRANSITIONS: Readonly<Record<MeetupState, readonly MeetupState[]>> = {
  proposed: ['proposed', 'confirmed', 'cancelled', 'expired'],
  confirmed: ['proposed', 'cancelled', 'completed', 'no_show'],
  cancelled: [],
  expired: [],
  completed: [],
  no_show: [],
};

const windowSchema = z.strictObject({ startsAt: schemas.timestamp(), endsAt: schemas.timestamp() });
const placeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('safe_spot'), safeSpotId: schemas.id('msp') }),
  z.strictObject({ kind: z.literal('private'), sealed: ciphertextSchema }),
]);
const meetupId = schemas.id('mtp');
const versionField = z.number().int().min(0).optional();

const proposeSchema = z.strictObject({
  threadId: threadIdSchema,
  participantIds: z.array(accountIdSchema).min(2).max(MAX_MEETUP_PARTICIPANTS),
  window: windowSchema,
  place: placeSchema,
});
const acceptSchema = z.strictObject({ meetupId, revision: z.number().int().min(1), expectedVersion: versionField });
const reviseSchema = z.strictObject({ meetupId, window: windowSchema.optional(), place: placeSchema.optional(), expectedVersion: versionField });
const cancelSchema = z.strictObject({ meetupId, reason: z.enum(['change_of_plans', 'unsafe', 'item_unavailable', 'other']), expectedVersion: versionField });
const getSchema = z.strictObject({ meetupId });
const listSchema = z.strictObject({ threadId: threadIdSchema });
const noShowSchema = z.strictObject({ meetupId, accountId: accountIdSchema });

export interface MeetupDto {
  readonly id: string;
  readonly threadId: string;
  readonly participantIds: readonly string[];
  readonly proposerId: string;
  readonly state: MeetupState;
  readonly revision: number;
  readonly revisedBy: string;
  readonly version: number;
  readonly window: MeetupWindow;
  readonly place:
    | { readonly kind: 'safe_spot'; readonly safeSpot: { readonly id: string; readonly name: string; readonly kind: string; readonly regionCell: string } | null }
    | { readonly kind: 'private'; readonly sealed: MultiRecipientCiphertext };
  readonly acceptedBy: readonly string[];
  readonly arrivals: Readonly<Record<string, number>>;
  readonly cancelReason?: string;
}

function validateWindow(now: number, w: MeetupWindow): void {
  if (w.endsAt <= w.startsAt) throw validationError('COMMS.WINDOW_INVALID', 'window must end after it starts');
  if (w.endsAt - w.startsAt > MAX_WINDOW_MS) throw validationError('COMMS.WINDOW_INVALID', 'window too long');
  if (w.startsAt < now) throw validationError('COMMS.WINDOW_INVALID', 'window must not start in the past');
  if (w.startsAt > now + MAX_LEAD_MS) throw validationError('COMMS.WINDOW_INVALID', 'window too far in the future');
}

export function createCoordination(env: Env) {
  const { deps, ports } = env;
  const meetups = () => col<Meetup>(env, COLLECTIONS.meetups);
  const noShows = () => col<NoShowClaim>(env, COLLECTIONS.noShows);
  const spots = () => col<SafeSpot>(env, COLLECTIONS.safeSpots);

  function toDto(m: Meetup, viewerId: string): MeetupDto {
    const place: MeetupDto['place'] =
      m.place.kind === 'safe_spot'
        ? { kind: 'safe_spot', safeSpot: ((s) => (s ? { id: s.id, name: s.name, kind: s.kind, regionCell: s.regionCell } : null))(spots().get(m.place.safeSpotId)) }
        : { kind: 'private', sealed: trimCiphertext(m.place.sealed, m.place.recipients[viewerId] ?? []) };
    return {
      id: m.id, threadId: m.threadId, participantIds: m.participantIds, proposerId: m.proposerId, state: m.state, revision: m.revision, revisedBy: m.revisedBy,
      version: m.version, window: m.window, place, acceptedBy: m.acceptedBy, arrivals: m.arrivals, ...(m.cancelReason ? { cancelReason: m.cancelReason } : {}),
    };
  }

  /** Loads a meetup the actor takes part in; the thread's active members must still include every meetup participant. */
  function loadMeetup(actor: Actor, id: string): Meetup {
    const m = meetups().get(id);
    if (!m || m.tenantId !== actor.tenantId) throw notFound('COMMS.MEETUP_NOT_FOUND', 'meetup not found');
    deps.authz.authorize(actor, 'comms.meetup:read', { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds });
    return m;
  }

  function resolvePlace(actor: Actor, participantIds: readonly string[], place: z.output<typeof placeSchema>): MeetupPlace {
    if (place.kind === 'safe_spot') {
      const spot = spots().get(place.safeSpotId);
      if (!spot || spot.tenantId !== actor.tenantId || spot.status !== 'active') throw precondition('COMMS.SAFE_SPOT_UNAVAILABLE', 'safe spot is not available');
      return { kind: 'safe_spot', safeSpotId: spot.id };
    }
    const recipients = resolveRecipientKeys(env, actor, participantIds);
    const sealed = place.sealed as MultiRecipientCiphertext;
    assertKeysMatch(sealed, recipients);
    return { kind: 'private', sealed, recipients };
  }

  function propose(ctx: CommandContext, input: unknown): MeetupDto {
    const req = parse(proposeSchema, input);
    return runCommand(deps, ctx, { name: 'comms.meetup.propose', flag: FLAGS.coordination, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.meetup:propose', view);
      ports.rateLimit.consume(`comms.meetup:${actor.id}`);
      const ids = [...new Set(req.participantIds)];
      const active = new Set(withStatus(view, 'active').map((p) => p.accountId));
      if (ids.length !== req.participantIds.length || !ids.includes(actor.id) || !ids.every((id) => active.has(id))) {
        throw conflict('COMMS.MEETUP_PARTICIPANTS_INVALID', 'participants must be distinct active members of the thread and include you');
      }
      assertNotBlocked(env, actor.id, ids.filter((id) => id !== actor.id));
      const now = deps.clock.now();
      validateWindow(now, req.window);
      const saved = meetups().put(
        {
          id: deps.ids.next('mtp'), tenantId: actor.tenantId, threadId: req.threadId, participantIds: ids, proposerId: actor.id, state: 'proposed', revision: 1,
          revisedBy: actor.id, window: req.window, place: resolvePlace(actor, ids, req.place), acceptedBy: [actor.id], arrivals: {}, createdAt: now, updatedAt: now,
        },
        0,
      );
      notifyEach(env, actor.tenantId, ids.filter((id) => id !== actor.id), 'comms.meetup', 'comms.meetup.proposed', { meetupId: saved.id, threadId: saved.threadId });
      return { result: toDto(saved, actor.id), events: [meetupEvent('comms.meetup.proposed', saved, actor.id)] };
    });
  }

  const meetupEvent = (type: string, m: Meetup, actorId: string) => ({
    type, aggregateType: 'meetup', aggregateId: m.id,
    revision: m.version, payload: { meetupId: m.id, threadId: m.threadId, meetupRevision: m.revision, state: m.state, actorId },
  });

  function move(m: Meetup, to: MeetupState, changes: Partial<Meetup>, expectedVersion?: number): Meetup {
    assertTransition('COMMS_MEETUP', m.state, to, TRANSITIONS);
    assertVersion('meetup', m.version, expectedVersion);
    return meetups().put({ ...m, ...changes, state: to, updatedAt: deps.clock.now() }, m.version);
  }

  function accept(ctx: CommandContext, input: unknown): MeetupDto {
    const req = parse(acceptSchema, input);
    return runCommand(deps, ctx, { name: 'comms.meetup.accept', flag: FLAGS.coordination, request: req }, () => {
      const { actor } = ctx;
      const m = loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.meetup:respond', { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds });
      if (m.revision !== req.revision) throw conflict('COMMS.MEETUP_REVISION_STALE', 'the meetup changed; review the latest revision', { current: m.revision });
      if (m.acceptedBy.includes(actor.id)) return { result: toDto(m, actor.id) };
      const acceptedBy = [...m.acceptedBy, actor.id];
      const everyone = m.participantIds.every((id) => acceptedBy.includes(id));
      if (everyone) validateStart(m);
      const saved = move(m, everyone ? 'confirmed' : 'proposed', { acceptedBy }, req.expectedVersion);
      if (everyone) notifyEach(env, actor.tenantId, m.participantIds.filter((id) => id !== actor.id), 'comms.meetup', 'comms.meetup.confirmed', { meetupId: saved.id, threadId: saved.threadId });
      return { result: toDto(saved, actor.id), events: [meetupEvent(everyone ? 'comms.meetup.confirmed' : 'comms.meetup.accepted', saved, actor.id)] };
    });
  }

  /** A confirmation after the start time would bind people to a window that has already begun. */
  function validateStart(m: Meetup): void {
    if (m.window.startsAt <= deps.clock.now()) throw conflict('COMMS.WINDOW_PASSED', 'the proposed window has already started; propose a new time');
  }

  function revise(kind: 'counter' | 'reschedule') {
    const from: MeetupState = kind === 'counter' ? 'proposed' : 'confirmed';
    return (ctx: CommandContext, input: unknown): MeetupDto => {
      const req = parse(reviseSchema, input);
      if (!req.window && !req.place) throw validationError('COMMS.REVISION_EMPTY', 'provide a new window or a new place');
      return runCommand(deps, ctx, { name: `comms.meetup.${kind}`, flag: FLAGS.coordination, request: req }, () => {
        const { actor } = ctx;
        const m = loadMeetup(actor, req.meetupId);
        deps.authz.authorize(actor, 'comms.meetup:respond', { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds });
        if (m.state !== from) throw conflict('COMMS_MEETUP.INVALID_TRANSITION', `${kind} requires a ${from} meetup`, { from: m.state, to: 'proposed' });
        if (req.window) validateWindow(deps.clock.now(), req.window);
        const place = req.place ? resolvePlace(actor, m.participantIds, req.place) : m.place;
        const saved = move(m, 'proposed', { revision: m.revision + 1, revisedBy: actor.id, window: req.window ?? m.window, place, acceptedBy: [actor.id], arrivals: {} }, req.expectedVersion);
        notifyEach(env, actor.tenantId, m.participantIds.filter((id) => id !== actor.id), 'comms.meetup', `comms.meetup.${kind}`, { meetupId: saved.id, threadId: saved.threadId });
        return { result: toDto(saved, actor.id), events: [meetupEvent(kind === 'counter' ? 'comms.meetup.countered' : 'comms.meetup.rescheduled', saved, actor.id)] };
      });
    };
  }

  function cancel(ctx: CommandContext, input: unknown): MeetupDto {
    const req = parse(cancelSchema, input);
    return runCommand(deps, ctx, { name: 'comms.meetup.cancel', flag: FLAGS.coordination, request: req }, () => {
      const { actor } = ctx;
      const m = loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.meetup:respond', { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds });
      const saved = move(m, 'cancelled', { cancelReason: req.reason }, req.expectedVersion);
      notifyEach(env, actor.tenantId, m.participantIds.filter((id) => id !== actor.id), 'comms.meetup', 'comms.meetup.cancelled', { meetupId: saved.id, threadId: saved.threadId });
      return { result: toDto(saved, actor.id), events: [meetupEvent('comms.meetup.cancelled', saved, actor.id)] };
    });
  }

  /** System sweeper: a proposal nobody finished confirming before its window started lapses. */
  function expireDue(ctx: CommandContext): { expired: number } {
    return runCommand(deps, ctx, { name: 'comms.meetup.expire_due', flag: FLAGS.coordination, request: {} }, () => {
      deps.authz.authorize(ctx.actor, 'comms.meetup:expire', { type: 'comms.meetup', tenantId: ctx.actor.tenantId });
      const now = deps.clock.now();
      const due = meetups().list((m) => m.tenantId === ctx.actor.tenantId && m.state === 'proposed' && m.window.startsAt <= now);
      const saved = due.map((m) => move(m, 'expired', {}));
      return { result: { expired: saved.length }, events: saved.map((m) => meetupEvent('comms.meetup.expired', m, ctx.actor.id)) };
    });
  }

  /** Records that `accountId` did not show. Both sides' claims are kept; a contradicting check-in is flagged, not resolved. */
  function reportNoShow(ctx: CommandContext, input: unknown): { meetupId: string; accusedId: string; contradictedByCheckIn: boolean; state: MeetupState } {
    const req = parse(noShowSchema, input);
    return runCommand(deps, ctx, { name: 'comms.meetup.report_no_show', flag: FLAGS.coordination, request: req }, () => {
      const { actor } = ctx;
      const m = loadMeetup(actor, req.meetupId);
      deps.authz.authorize(actor, 'comms.meetup:report', { type: 'comms.meetup', id: m.id, tenantId: m.tenantId, participantIds: m.participantIds });
      if (req.accountId === actor.id || !m.participantIds.includes(req.accountId)) throw validationError('COMMS.NO_SHOW_INVALID', 'accused must be another participant of the meetup');
      if (m.state !== 'confirmed' && m.state !== 'no_show') throw conflict('COMMS_MEETUP.INVALID_TRANSITION', 'only a confirmed meetup can have a no-show', { from: m.state, to: 'no_show' });
      if (deps.clock.now() < m.window.startsAt) throw precondition('COMMS.NO_SHOW_TOO_EARLY', 'the meetup window has not started');
      const id = `${m.id}:${actor.id}:${req.accountId}`;
      const prior = noShows().get(id);
      const claim = prior ?? noShows().put({ id, tenantId: m.tenantId, meetupId: m.id, reporterId: actor.id, accusedId: req.accountId, at: deps.clock.now(), contradictedByCheckIn: m.arrivals[req.accountId] !== undefined }, 0);
      const saved = m.state === 'no_show' ? m : move(m, 'no_show', {});
      return {
        result: { meetupId: m.id, accusedId: claim.accusedId, contradictedByCheckIn: claim.contradictedByCheckIn, state: saved.state },
        events: prior ? [] : [{ type: 'comms.meetup.no_show_reported', aggregateType: 'no_show_claim', aggregateId: claim.id, revision: claim.version, payload: { meetupId: m.id, reporterId: actor.id, accusedId: claim.accusedId, contradictedByCheckIn: claim.contradictedByCheckIn } }],
      };
    });
  }

  function get(actor: Actor, input: unknown): MeetupDto {
    const req = parse(getSchema, input);
    requireFeature(deps.flags, FLAGS.coordination, actor.tenantId);
    return toDto(loadMeetup(actor, req.meetupId), actor.id);
  }

  function list(actor: Actor, input: unknown): { meetups: MeetupDto[] } {
    const req = parse(listSchema, input);
    requireFeature(deps.flags, FLAGS.coordination, actor.tenantId);
    authorizeThread(env, actor, 'comms.meetup:read', loadThread(env, actor, req.threadId));
    const mine = meetups().list((m) => m.threadId === req.threadId && m.participantIds.includes(actor.id)).sort((a, b) => a.id.localeCompare(b.id));
    return { meetups: mine.map((m) => toDto(m, actor.id)) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.meetup.propose', kind: 'command', flag: FLAGS.coordination, summary: 'Propose a meetup window and place', handler: propose },
    { name: 'comms.meetup.accept', kind: 'command', flag: FLAGS.coordination, summary: 'Accept a meetup revision', handler: accept },
    { name: 'comms.meetup.counter', kind: 'command', flag: FLAGS.coordination, summary: 'Counter-propose window or place', handler: revise('counter') },
    { name: 'comms.meetup.reschedule', kind: 'command', flag: FLAGS.coordination, summary: 'Reschedule a confirmed meetup', handler: revise('reschedule') },
    { name: 'comms.meetup.cancel', kind: 'command', flag: FLAGS.coordination, summary: 'Cancel a meetup', handler: cancel },
    { name: 'comms.meetup.report_no_show', kind: 'command', flag: FLAGS.coordination, summary: 'Report that another participant did not show', handler: reportNoShow },
    { name: 'comms.meetup.expire_due', kind: 'command', flag: FLAGS.coordination, summary: 'System: expire unconfirmed proposals', handler: (ctx) => expireDue(ctx) },
    { name: 'comms.meetup.get', kind: 'query', flag: FLAGS.coordination, summary: 'Read a meetup', handler: (ctx, input) => get(ctx.actor, input) },
    { name: 'comms.meetup.list', kind: 'query', flag: FLAGS.coordination, summary: 'List meetups of a thread', handler: (ctx, input) => list(ctx.actor, input) },
  ]);

  return { propose, accept, counter: revise('counter'), reschedule: revise('reschedule'), cancel, reportNoShow, expireDue, get, list, loadMeetup, move, toDto, operations };
}

export type Coordination = ReturnType<typeof createCoordination>;
