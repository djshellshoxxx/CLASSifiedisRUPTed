/**
 * @classrup/comms (F08): end-to-end encrypted threads, negotiation cards with signed consent, and
 * safe-meetup coordination. The relay stores ciphertext and routing metadata only.
 *
 * Relay wiring notes (no event subscriptions live in this package):
 * - `verifyConsent(envelope, expectedAccountId?)` and `hasAllConsent(...)` are for other features' ports.
 * - Schedule the system commands `comms.message.expire_due`, `comms.attachment.expire_due` and
 *   `comms.meetup.expire_due` (for example every minute) with a system actor.
 * - After a block is created in moderation, nothing needs to be called: `BlockPort` is consulted on every
 *   create, invite, accept, send and meetup proposal.
 */
import type { Deps, ModuleDescriptor, Operation } from '@classrup/kernel';
import { defineModules, defineOperations } from '@classrup/kernel';
import type { PolicyRule } from '@classrup/security';
import { anyone, authenticated, hasAnyRole, isOwner, isParticipant, isSystem } from '@classrup/security';
import { createAttachments } from './messaging/attachments';
import { createPrivateMessaging } from './messaging/private';
import { createThreads } from './messaging/threads';
import { createCoordination } from './meetups/coordination';
import { createHandoff } from './meetups/handoff';
import { createSafeSpots } from './meetups/safe';
import { createConsent } from './negotiation/consent';
import { createOffers } from './negotiation/offers';
import type { CommsPorts } from './ports';
import { resolvePorts } from './ports';
import type { Env } from './support';
import { COLLECTIONS, FLAGS } from './support';

export * from './client';
export * from './messaging/strip';
export { ALLOWED_MIME, MAX_ATTACHMENT_BYTES } from './messaging/attachments';
export { CONSENT_CONTEXT, verifyConsent as verifyConsentStatement } from './negotiation/consent';
export type { ConsentVerification, ConsentRejection } from './negotiation/consent';
export { SAFETY_TIPS } from './meetups/safe';
export type { CommsPorts } from './ports';
export type { ThreadDto, ParticipantDto } from './messaging/threads';
export type { MessageDto } from './messaging/private';
export type { AttachmentDto } from './messaging/attachments';
export type { CardDto } from './negotiation/offers';
export type { ConsentDto } from './negotiation/consent';
export type { SafeSpotDto } from './meetups/safe';
export type { MeetupDto } from './meetups/coordination';
export type { ConfirmResult, ConfirmOutcome, SharedMeetupView } from './meetups/handoff';
export type { ConsentStatement, ConsentDecision, SubjectType } from './types';

export function createComms(deps: Deps, ports: CommsPorts) {
  const env: Env = { deps, ports: resolvePorts(ports) };
  const threads = createThreads(env);
  const messaging = createPrivateMessaging(env);
  const attachments = createAttachments(env);
  const offers = createOffers(env);
  const consent = createConsent(env);
  const safeSpots = createSafeSpots(env);
  const coordination = createCoordination(env);
  const handoff = createHandoff(env, coordination);

  const operations: readonly Operation[] = defineOperations([
    ...threads.operations,
    ...messaging.operations,
    ...attachments.operations,
    ...offers.operations,
    ...consent.operations,
    ...safeSpots.operations,
    ...coordination.operations,
    ...handoff.operations,
  ]);

  return {
    operations,
    threads,
    messaging,
    attachments,
    offers,
    consent,
    safeSpots,
    coordination,
    handoff,
    /** Reusable by other features via the relay: verifies a signed consent envelope against identity's signing keys. */
    verifyConsent: consent.verifyConsent,
    /** True when every listed account's latest decision for the exact revision is `accept`. */
    hasAllConsent: consent.hasAllConsent,
  };
}

export type Comms = ReturnType<typeof createComms>;

const member = { allow: isParticipant };

export const POLICIES: readonly PolicyRule[] = [
  { permission: 'comms.thread:create', allow: authenticated, description: 'Start a thread' },
  { permission: 'comms.thread:list', allow: authenticated, description: 'List own threads' },
  { permission: 'comms.thread:read', ...member, description: 'Read a thread you belong to or are invited to' },
  { permission: 'comms.thread:invite', ...member, description: 'Invite an account to a thread you are active in' },
  { permission: 'comms.thread:respond', ...member, description: 'Answer your own invitation' },
  { permission: 'comms.thread:leave', ...member, description: 'Leave a thread' },
  { permission: 'comms.thread:archive', ...member, description: 'Archive a thread for yourself' },
  { permission: 'comms.thread:mute', ...member, description: 'Mute a thread for yourself' },
  { permission: 'comms.thread:configure', allow: isOwner, description: 'Thread creator sets disappearing messages' },
  { permission: 'comms.message:send', ...member, description: 'Send an encrypted message to a thread' },
  { permission: 'comms.message:read', ...member, description: 'Read messages addressed to you' },
  { permission: 'comms.message:delete', ...member, description: 'Delete a message for yourself' },
  { permission: 'comms.message:purge', allow: isSystem, description: 'System sweeper purges expired messages' },
  { permission: 'comms.receipt:write', ...member, description: 'Set receipt sharing and read position' },
  { permission: 'comms.receipt:read', ...member, description: 'See shared read positions' },
  { permission: 'comms.attachment:register', ...member, description: 'Register attachment metadata' },
  { permission: 'comms.attachment:read', ...member, description: 'Read attachment metadata' },
  { permission: 'comms.attachment:purge', allow: isSystem, description: 'System sweeper discards unsent attachments' },
  { permission: 'comms.card:post', ...member, description: 'Post a negotiation card' },
  { permission: 'comms.card:read', ...member, description: 'Read negotiation cards' },
  { permission: 'comms.consent:record', allow: isOwner, description: 'Record your own signed consent' },
  { permission: 'comms.consent:read', ...member, description: 'Read consent decisions in your thread' },
  { permission: 'comms.safe_spot:read', allow: anyone, public: true, description: 'Browse public safe spots' },
  { permission: 'comms.safe_spot:manage', allow: hasAnyRole('moderator', 'admin'), description: 'Curate safe spots' },
  { permission: 'comms.safety:tips', allow: anyone, public: true, description: 'Read safety tips' },
  { permission: 'comms.safety:view_share', allow: anyone, public: true, description: 'Trusted contact views a shared meetup by token' },
  { permission: 'comms.safety:share', ...member, description: 'Create or list share links for your meetup' },
  { permission: 'comms.safety:revoke_share', allow: isOwner, description: 'Revoke your share link' },
  { permission: 'comms.meetup:propose', ...member, description: 'Propose a meetup in your thread' },
  { permission: 'comms.meetup:read', ...member, description: 'Read meetups you take part in' },
  { permission: 'comms.meetup:respond', ...member, description: 'Accept, counter, reschedule or cancel a meetup' },
  { permission: 'comms.meetup:report', ...member, description: 'Report a no-show' },
  { permission: 'comms.meetup:expire', allow: isSystem, description: 'System sweeper expires unconfirmed proposals' },
  { permission: 'comms.handoff:checkin', ...member, description: 'Check in at a meetup' },
  { permission: 'comms.handoff:code', ...member, description: 'Receiver publishes a handoff code hash' },
  { permission: 'comms.handoff:confirm', ...member, description: 'Giver confirms a handoff code' },
];

const C = COLLECTIONS;

export const MODULES: readonly ModuleDescriptor[] = defineModules([
  {
    id: 'F08.S01.M01', path: '08_Communications/01_messaging/mod_private', flag: FLAGS.private,
    summary: 'End-to-end encrypted messages with gapless per-thread sequence, disappearing messages and opt-in read receipts',
    permissions: ['comms.message:send', 'comms.message:read', 'comms.message:delete', 'comms.message:purge', 'comms.receipt:write', 'comms.receipt:read'],
    events: ['comms.message.sent', 'comms.message.purged', 'comms.receipt.marked'],
    collections: [C.messages, C.counters, C.readMarks],
  },
  {
    id: 'F08.S01.M02', path: '08_Communications/01_messaging/mod_threads', flag: FLAGS.threads,
    summary: 'Threads of 2..20 participants bound to a subject, invitation-based membership, per-participant archive and mute',
    permissions: ['comms.thread:create', 'comms.thread:list', 'comms.thread:read', 'comms.thread:invite', 'comms.thread:respond', 'comms.thread:leave', 'comms.thread:archive', 'comms.thread:mute', 'comms.thread:configure'],
    events: ['comms.thread.created', 'comms.thread.configured', 'comms.participant.invited', 'comms.participant.joined', 'comms.participant.declined', 'comms.participant.left'],
    collections: [C.threads, C.participants],
  },
  {
    id: 'F08.S01.M03', path: '08_Communications/01_messaging/mod_attachments', flag: FLAGS.attachments,
    summary: 'Encrypted attachment metadata (hash, size, mime allowlist) and client-side JPEG/PNG metadata stripping',
    permissions: ['comms.attachment:register', 'comms.attachment:read', 'comms.attachment:purge'],
    events: ['comms.attachment.registered', 'comms.attachment.expired'],
    collections: [C.attachments],
  },
  {
    id: 'F08.S02.M01', path: '08_Communications/02_negotiation/mod_offers', flag: FLAGS.offers,
    summary: 'Negotiation cards referencing canonical offers, proposals and cycles by id and revision hash',
    permissions: ['comms.card:post', 'comms.card:read'],
    events: ['comms.card.posted'],
    collections: [C.cards],
  },
  {
    id: 'F08.S02.M02', path: '08_Communications/02_negotiation/mod_consent', flag: FLAGS.consent,
    summary: 'Signed per-revision consent statements verified against identity signing keys; append-only evidence',
    permissions: ['comms.consent:record', 'comms.consent:read'],
    events: ['comms.consent.recorded'],
    collections: [C.consents],
  },
  {
    id: 'F08.S03.M01', path: '08_Communications/03_meetups/mod_safe', flag: FLAGS.safe,
    summary: 'Moderator-curated public safe meeting spots (name, kind, region cell) and safety tips',
    permissions: ['comms.safe_spot:read', 'comms.safe_spot:manage', 'comms.safety:tips'],
    events: ['comms.safe_spot.created', 'comms.safe_spot.retired'],
    collections: [C.safeSpots],
  },
  {
    id: 'F08.S03.M02', path: '08_Communications/03_meetups/mod_handoff', flag: FLAGS.handoff,
    summary: 'Arrival check-in, hashed 6-digit handoff confirmation codes and trusted-contact share links',
    permissions: ['comms.handoff:checkin', 'comms.handoff:code', 'comms.handoff:confirm', 'comms.safety:share', 'comms.safety:view_share', 'comms.safety:revoke_share'],
    events: ['comms.handoff.checked_in', 'comms.handoff.confirmed_by_code', 'comms.handoff.code_rejected', 'comms.safety.shared', 'comms.safety.share_revoked'],
    collections: [C.handoffs, C.shares],
  },
  {
    id: 'F08.S03.M03', path: '08_Communications/03_meetups/mod_coordination', flag: FLAGS.coordination,
    summary: 'Meetup proposal, acceptance, counter, reschedule and cancel with per-revision consent; encrypted private places; no-show claims',
    permissions: ['comms.meetup:propose', 'comms.meetup:read', 'comms.meetup:respond', 'comms.meetup:report', 'comms.meetup:expire'],
    events: [
      'comms.meetup.proposed', 'comms.meetup.accepted', 'comms.meetup.confirmed', 'comms.meetup.countered', 'comms.meetup.rescheduled',
      'comms.meetup.cancelled', 'comms.meetup.expired', 'comms.meetup.no_show_reported',
    ],
    collections: [C.meetups, C.noShows],
  },
]);
