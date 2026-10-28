/** F08.S01.M02 threads: 2..20 participants, invitation-based membership, per-participant archive/mute. */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, defineOperations, MINUTE, DAY, parse, requireFeature, runCommand, z } from '@classrup/kernel';
import { accountIdSchema, assertRefId, threadIdSchema } from '../schemas';
import type { Env } from '../support';
import {
  assertNotBlocked, authorizeThread, col, COLLECTIONS, FLAGS, loadThread, MAX_PARTICIPANTS, notifyEach, participantId, requireActiveAccount,
  resolveRecipientKeys, withStatus, type ThreadView,
} from '../support';
import type { Participant, ParticipantStatus, Thread } from '../types';
import { SUBJECT_TYPES } from '../types';

const TRANSITIONS: Readonly<Record<ParticipantStatus, readonly ParticipantStatus[]>> = {
  invited: ['active', 'declined'],
  active: ['left'],
  declined: ['invited'],
  left: ['invited'],
};

const ttlSchema = z.number().int().min(MINUTE).max(30 * DAY);
const subjectSchema = z.strictObject({ type: z.enum(SUBJECT_TYPES), id: z.string().max(64) });

const createSchema = z.strictObject({
  invitees: z.array(accountIdSchema).min(1).max(MAX_PARTICIPANTS - 1),
  subject: subjectSchema.optional(),
  disappearingTtlMs: ttlSchema.optional(),
});
const threadRef = z.strictObject({ threadId: threadIdSchema, expectedVersion: z.number().int().min(0).optional() });
const inviteSchema = threadRef.extend({ accountId: accountIdSchema });
const respondSchema = threadRef.extend({ accept: z.boolean() });
const archiveSchema = threadRef.extend({ archived: z.boolean() });
const muteSchema = threadRef.extend({ muted: z.boolean() });
const ttlUpdateSchema = threadRef.extend({ disappearingTtlMs: ttlSchema.nullable() });
const listSchema = z.strictObject({ archived: z.boolean().default(false), limit: z.number().int().min(1).max(100).default(50) });

export interface ParticipantDto {
  readonly accountId: string;
  readonly status: ParticipantStatus;
  readonly readReceipts: boolean;
  /** Present only for the caller's own entry. */
  readonly archived?: boolean;
  readonly muted?: boolean;
}

export interface ThreadDto {
  readonly id: string;
  readonly version: number;
  readonly createdBy: string;
  readonly subject?: { readonly type: string; readonly id: string };
  readonly disappearingTtlMs?: number;
  readonly createdAt: number;
  readonly participants: readonly ParticipantDto[];
}

export function threadDto(view: ThreadView, viewerId: string): ThreadDto {
  const { thread } = view;
  return {
    id: thread.id,
    version: thread.version,
    createdBy: thread.createdBy,
    ...(thread.subject ? { subject: { type: thread.subject.type, id: thread.subject.id } } : {}),
    ...(thread.disappearingTtlMs !== undefined ? { disappearingTtlMs: thread.disappearingTtlMs } : {}),
    createdAt: thread.createdAt,
    participants: view.participants
      .filter((p) => p.status !== 'declined')
      .map((p) => ({
        accountId: p.accountId,
        status: p.status,
        readReceipts: p.readReceipts,
        ...(p.accountId === viewerId ? { archived: p.archived, muted: p.muted } : {}),
      })),
  };
}

function newParticipant(env: Env, thread: Thread, accountId: string, status: ParticipantStatus, invitedBy: string): Participant {
  const now = env.deps.clock.now();
  return {
    id: participantId(thread.id, accountId), tenantId: thread.tenantId, threadId: thread.id, accountId, status, invitedBy,
    archived: false, muted: false, readReceipts: false, createdAt: now, updatedAt: now, version: 0,
  };
}

function putParticipant(env: Env, p: Participant, next: Partial<Participant>, expectedVersion?: number): Participant {
  assertVersion('participant', p.version, expectedVersion);
  return col<Participant>(env, COLLECTIONS.participants).put({ ...p, ...next, updatedAt: env.deps.clock.now() }, p.version);
}

function participantEvent(type: string, p: Participant) {
  return { type, aggregateType: 'participant', aggregateId: p.id, revision: p.version, payload: { threadId: p.threadId, accountId: p.accountId, status: p.status } };
}

function transition(env: Env, p: Participant, to: ParticipantStatus, expectedVersion?: number): Participant {
  assertTransition('COMMS', p.status, to, TRANSITIONS);
  return putParticipant(env, p, { status: to }, expectedVersion);
}

/** Active and invited participants count toward the 20-participant cap. */
function assertCapacity(view: ThreadView, adding: number): void {
  if (withStatus(view, 'active', 'invited').length + adding > MAX_PARTICIPANTS) {
    throw conflict('COMMS.THREAD_FULL', `a thread holds at most ${MAX_PARTICIPANTS} participants`);
  }
}

export function createThreads(env: Env) {
  const { deps, ports } = env;
  const threads = () => col<Thread>(env, COLLECTIONS.threads);
  const participants = () => col<Participant>(env, COLLECTIONS.participants);

  function create(ctx: CommandContext, input: unknown): ThreadDto {
    const req = parse(createSchema, input);
    return runCommand(deps, ctx, { name: 'comms.thread.create', flag: FLAGS.threads, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'comms.thread:create', { type: 'comms.thread', tenantId: actor.tenantId });
      ports.rateLimit.consume(`comms.thread_create:${actor.id}`);
      const invitees = [...new Set(req.invitees)];
      if (invitees.length !== req.invitees.length || invitees.includes(actor.id)) {
        throw conflict('COMMS.INVITEES_INVALID', 'invitees must be unique and must not include yourself');
      }
      if (req.subject) assertRefId(req.subject.type, req.subject.id);
      for (const id of invitees) {
        requireActiveAccount(env, actor, id);
        assertNotBlocked(env, actor.id, [id]);
      }
      const now = deps.clock.now();
      const thread = threads().put(
        {
          id: deps.ids.next('thr'), tenantId: actor.tenantId, createdBy: actor.id, createdAt: now,
          ...(req.subject ? { subject: req.subject } : {}),
          ...(req.disappearingTtlMs !== undefined ? { disappearingTtlMs: req.disappearingTtlMs } : {}),
        },
        0,
      );
      const creator = participants().put(newParticipant(env, thread, actor.id, 'active', actor.id), 0);
      const invited = invitees.map((id) => participants().put(newParticipant(env, thread, id, 'invited', actor.id), 0));
      notifyEach(env, actor.tenantId, invitees, 'comms.thread', 'comms.thread.invited', { threadId: thread.id });
      const view: ThreadView = { thread, participants: [creator, ...invited], self: creator };
      return {
        result: threadDto(view, actor.id),
        events: [
          { type: 'comms.thread.created', aggregateType: 'thread', aggregateId: thread.id, revision: thread.version, payload: { threadId: thread.id, createdBy: actor.id, subject: thread.subject ?? null } },
          ...view.participants.map((p) => participantEvent(p.status === 'active' ? 'comms.participant.joined' : 'comms.participant.invited', p)),
        ],
      };
    });
  }

  function invite(ctx: CommandContext, input: unknown): ThreadDto {
    const req = parse(inviteSchema, input);
    return runCommand(deps, ctx, { name: 'comms.thread.invite', flag: FLAGS.threads, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.thread:invite', view);
      ports.rateLimit.consume(`comms.invite:${actor.id}`);
      requireActiveAccount(env, actor, req.accountId);
      assertNotBlocked(env, req.accountId, withStatus(view, 'active').map((p) => p.accountId));
      const existing = view.participants.find((p) => p.accountId === req.accountId);
      if (existing && (existing.status === 'active' || existing.status === 'invited')) {
        throw conflict('COMMS.ALREADY_PARTICIPANT', 'account is already invited or active');
      }
      assertCapacity(view, 1);
      const saved = existing
        ? transition(env, existing, 'invited')
        : participants().put(newParticipant(env, view.thread, req.accountId, 'invited', actor.id), 0);
      notifyEach(env, actor.tenantId, [req.accountId], 'comms.thread', 'comms.thread.invited', { threadId: view.thread.id });
      const next = { ...view, participants: [...view.participants.filter((p) => p.id !== saved.id), saved] };
      return { result: threadDto(next, actor.id), events: [participantEvent('comms.participant.invited', saved)] };
    });
  }

  function respond(ctx: CommandContext, input: unknown): ThreadDto {
    const req = parse(respondSchema, input);
    return runCommand(deps, ctx, { name: 'comms.thread.respond', flag: FLAGS.threads, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.thread:respond', view, ['invited']);
      const self = view.self as Participant;
      if (req.accept) assertNotBlocked(env, actor.id, withStatus(view, 'active').map((p) => p.accountId));
      const saved = transition(env, self, req.accept ? 'active' : 'declined', req.expectedVersion);
      const next = { ...view, participants: view.participants.map((p) => (p.id === saved.id ? saved : p)), self: saved };
      return { result: threadDto(next, actor.id), events: [participantEvent(req.accept ? 'comms.participant.joined' : 'comms.participant.declined', saved)] };
    });
  }

  function leave(ctx: CommandContext, input: unknown): ThreadDto {
    const req = parse(threadRef, input);
    return runCommand(deps, ctx, { name: 'comms.thread.leave', flag: FLAGS.threads, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.thread:leave', view);
      const saved = transition(env, view.self as Participant, 'left', req.expectedVersion);
      const next = { ...view, participants: view.participants.map((p) => (p.id === saved.id ? saved : p)), self: saved };
      return { result: threadDto(next, actor.id), events: [participantEvent('comms.participant.left', saved)] };
    });
  }

  /** Archive and mute are private preferences of one participant: no events, no effect on others. */
  function preference(name: string, permission: 'comms.thread:archive' | 'comms.thread:mute', schema: typeof archiveSchema | typeof muteSchema) {
    return (ctx: CommandContext, input: unknown): ThreadDto => {
      const req = parse(schema, input) as { threadId: string; expectedVersion?: number; archived?: boolean; muted?: boolean };
      return runCommand(deps, ctx, { name, flag: FLAGS.threads, request: req }, () => {
        const { actor } = ctx;
        const view = loadThread(env, actor, req.threadId);
        authorizeThread(env, actor, permission, view, ['active', 'invited']);
        const self = view.self as Participant;
        const saved = putParticipant(env, self, req.archived !== undefined ? { archived: req.archived } : { muted: req.muted as boolean }, req.expectedVersion);
        const next = { ...view, participants: view.participants.map((p) => (p.id === saved.id ? saved : p)), self: saved };
        return { result: threadDto(next, actor.id) };
      });
    };
  }

  function setDisappearing(ctx: CommandContext, input: unknown): ThreadDto {
    const req = parse(ttlUpdateSchema, input);
    return runCommand(deps, ctx, { name: 'comms.thread.set_disappearing', flag: FLAGS.private, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.thread:configure', view);
      assertVersion('thread', view.thread.version, req.expectedVersion);
      const { disappearingTtlMs: _previous, ...rest } = view.thread;
      const saved = threads().put({ ...rest, ...(req.disappearingTtlMs !== null ? { disappearingTtlMs: req.disappearingTtlMs } : {}) }, view.thread.version);
      return {
        result: threadDto({ ...view, thread: saved }, actor.id),
        events: [
          { type: 'comms.thread.configured', aggregateType: 'thread', aggregateId: saved.id, revision: saved.version, payload: { threadId: saved.id, disappearingTtlMs: req.disappearingTtlMs } },
        ],
      };
    });
  }

  function get(actor: Actor, input: unknown): ThreadDto {
    const req = parse(z.strictObject({ threadId: threadIdSchema }), input);
    requireFeature(deps.flags, FLAGS.threads, actor.tenantId);
    const view = loadThread(env, actor, req.threadId);
    authorizeThread(env, actor, 'comms.thread:read', view, ['active', 'invited']);
    return threadDto(view, actor.id);
  }

  function list(actor: Actor, input: unknown): { threads: ThreadDto[] } {
    const req = parse(listSchema, input ?? {});
    requireFeature(deps.flags, FLAGS.threads, actor.tenantId);
    deps.authz.authorize(actor, 'comms.thread:list', { type: 'comms.thread', tenantId: actor.tenantId });
    const mine = participants().list((p) => p.accountId === actor.id && p.tenantId === actor.tenantId && p.archived === req.archived && (p.status === 'active' || p.status === 'invited'));
    const ids = mine.map((p) => p.threadId).sort().reverse().slice(0, req.limit);
    return { threads: ids.map((id) => threadDto(loadThread(env, actor, id), actor.id)) };
  }

  /** Box key ids a client must encrypt to right now: all active participants' keys. */
  function keys(actor: Actor, input: unknown): { threadId: string; recipients: { accountId: string; boxKeyIds: string[] }[] } {
    const req = parse(z.strictObject({ threadId: threadIdSchema }), input);
    requireFeature(deps.flags, FLAGS.private, actor.tenantId);
    const view = loadThread(env, actor, req.threadId);
    authorizeThread(env, actor, 'comms.thread:read', view);
    const resolved = resolveRecipientKeys(env, actor, withStatus(view, 'active').map((p) => p.accountId));
    return { threadId: req.threadId, recipients: Object.entries(resolved).map(([accountId, boxKeyIds]) => ({ accountId, boxKeyIds })) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.thread.create', kind: 'command', flag: FLAGS.threads, summary: 'Create a thread and invite participants', handler: create },
    { name: 'comms.thread.invite', kind: 'command', flag: FLAGS.threads, summary: 'Invite an account to a thread', handler: invite },
    { name: 'comms.thread.respond', kind: 'command', flag: FLAGS.threads, summary: 'Accept or decline an invitation', handler: respond },
    { name: 'comms.thread.leave', kind: 'command', flag: FLAGS.threads, summary: 'Leave a thread', handler: leave },
    { name: 'comms.thread.archive', kind: 'command', flag: FLAGS.threads, summary: 'Archive or unarchive a thread for me', handler: preference('comms.thread.archive', 'comms.thread:archive', archiveSchema) },
    { name: 'comms.thread.mute', kind: 'command', flag: FLAGS.threads, summary: 'Mute or unmute notifications for me', handler: preference('comms.thread.mute', 'comms.thread:mute', muteSchema) },
    { name: 'comms.thread.set_disappearing', kind: 'command', flag: FLAGS.private, summary: 'Set or clear the disappearing-message TTL', handler: setDisappearing },
    { name: 'comms.thread.get', kind: 'query', flag: FLAGS.threads, summary: 'Read one thread', handler: (ctx, input) => get(ctx.actor, input) },
    { name: 'comms.thread.list', kind: 'query', flag: FLAGS.threads, summary: 'List my threads', handler: (ctx, input) => list(ctx.actor, input) },
    { name: 'comms.thread.keys', kind: 'query', flag: FLAGS.private, summary: 'Box keys to encrypt a message to', handler: (ctx, input) => keys(ctx.actor, input) },
  ]);

  return { create, invite, respond, leave, setDisappearing, get, list, keys, operations };
}
