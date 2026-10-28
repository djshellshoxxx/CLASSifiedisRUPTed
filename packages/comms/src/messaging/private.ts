/**
 * F08.S01.M01 private messaging. The relay stores end-to-end encrypted payloads plus routing metadata
 * only: thread id, sender, server receive time and a per-thread gapless sequence number.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { conflict, defineOperations, notFound, parse, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import type { MultiRecipientCiphertext } from '@classrup/security';
import { ciphertextSchema, threadIdSchema } from '../schemas';
import type { Env, ThreadView } from '../support';
import {
  assertKeysMatch, assertNotBlocked, authorizeThread, col, COLLECTIONS, FLAGS, loadThread, notifyEach, resolveRecipientKeys, trimCiphertext, withStatus,
} from '../support';
import type { Attachment, Message, Participant, ReadMark, ThreadCounter } from '../types';

const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const PURGE_BATCH = 500;

const sendSchema = z.strictObject({
  threadId: threadIdSchema,
  ciphertext: ciphertextSchema,
  attachmentIds: z.array(schemas.id('att')).max(MAX_ATTACHMENTS_PER_MESSAGE).default([]),
});
const listSchema = z.strictObject({
  threadId: threadIdSchema,
  sinceSequence: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(200).default(100),
});
const deleteSchema = z.strictObject({ messageId: schemas.id('msg') });
const markSchema = z.strictObject({ threadId: threadIdSchema, upToSequence: z.number().int().min(1) });
const receiptSettingSchema = z.strictObject({ threadId: threadIdSchema, enabled: z.boolean(), expectedVersion: z.number().int().min(0).optional() });
const threadOnly = z.strictObject({ threadId: threadIdSchema });

export interface MessageDto {
  readonly id: string;
  readonly threadId: string;
  readonly sequence: number;
  readonly senderId: string;
  readonly receivedAt: number;
  readonly expiresAt?: number;
  readonly ciphertext: MultiRecipientCiphertext;
  readonly attachmentIds: readonly string[];
}

const isLive = (m: Message, now: number): boolean => m.expiresAt === undefined || m.expiresAt > now;

function messageDto(m: Message, viewerId: string): MessageDto {
  return {
    id: m.id, threadId: m.threadId, sequence: m.sequence, senderId: m.senderId, receivedAt: m.receivedAt,
    ...(m.expiresAt !== undefined ? { expiresAt: m.expiresAt } : {}),
    ciphertext: trimCiphertext(m.ciphertext, m.recipients[viewerId] ?? []),
    attachmentIds: m.attachmentIds,
  };
}

export function createPrivateMessaging(env: Env) {
  const { deps, ports } = env;
  const messages = () => col<Message>(env, COLLECTIONS.messages);
  const counters = () => col<ThreadCounter>(env, COLLECTIONS.counters);
  const attachments = () => col<Attachment>(env, COLLECTIONS.attachments);
  const marks = () => col<ReadMark>(env, COLLECTIONS.readMarks);
  const participants = () => col<Participant>(env, COLLECTIONS.participants);

  /** Sequence assignment shares the message transaction, so a rolled-back send never burns a number. */
  function nextSequence(threadId: string): number {
    const current = counters().get(threadId);
    const sequence = (current?.last ?? 0) + 1;
    counters().put({ id: threadId, threadId, last: sequence }, current?.version ?? 0);
    return sequence;
  }

  function claimAttachments(ids: readonly string[], view: ThreadView, senderId: string, messageId: string): void {
    if (new Set(ids).size !== ids.length) throw conflict('COMMS.ATTACHMENT_INVALID', 'duplicate attachment');
    for (const id of ids) {
      const att = attachments().get(id);
      if (!att || att.threadId !== view.thread.id || att.uploaderId !== senderId) throw conflict('COMMS.ATTACHMENT_INVALID', 'attachment is not available for this message');
      if (att.status !== 'pending') throw conflict('COMMS.ATTACHMENT_INVALID', 'attachment already used');
      attachments().put({ ...att, status: 'attached', messageId }, att.version);
    }
  }

  function send(ctx: CommandContext, input: unknown): MessageDto {
    const req = parse(sendSchema, input);
    return runCommand(deps, ctx, { name: 'comms.message.send', flag: FLAGS.private, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.message:send', view);
      ports.rateLimit.consume(`comms.send:${actor.id}`);
      const active = withStatus(view, 'active').map((p) => p.accountId);
      if (active.length < 2) throw conflict('COMMS.THREAD_NOT_READY', 'no other participant has accepted yet');
      assertNotBlocked(env, actor.id, active.filter((id) => id !== actor.id));
      const recipients = resolveRecipientKeys(env, actor, active);
      const ciphertext = req.ciphertext as MultiRecipientCiphertext;
      assertKeysMatch(ciphertext, recipients);
      const now = deps.clock.now();
      const id = deps.ids.next('msg');
      claimAttachments(req.attachmentIds, view, actor.id, id);
      const ttl = view.thread.disappearingTtlMs;
      const saved = messages().put(
        {
          id, tenantId: actor.tenantId, threadId: view.thread.id, sequence: nextSequence(view.thread.id), senderId: actor.id, ciphertext, recipients,
          attachmentIds: req.attachmentIds, receivedAt: now, ...(ttl !== undefined ? { expiresAt: now + ttl } : {}), deletedFor: [],
        },
        0,
      );
      const others = withStatus(view, 'active').filter((p) => p.accountId !== actor.id && !p.muted);
      notifyEach(env, actor.tenantId, others.map((p) => p.accountId), 'comms.message', 'comms.message.new', { threadId: saved.threadId });
      return {
        result: messageDto(saved, actor.id),
        events: [{ type: 'comms.message.sent', aggregateType: 'message', aggregateId: saved.id, revision: saved.version, payload: { threadId: saved.threadId, messageId: saved.id, sequence: saved.sequence, senderId: saved.senderId } }],
      };
    });
  }

  function list(actor: Actor, input: unknown): { messages: MessageDto[]; hasMore: boolean } {
    const req = parse(listSchema, input);
    requireFeature(deps.flags, FLAGS.private, actor.tenantId);
    const view = loadThread(env, actor, req.threadId);
    authorizeThread(env, actor, 'comms.message:read', view);
    const now = deps.clock.now();
    const visible = messages()
      .list((m) => m.threadId === req.threadId && m.sequence > req.sinceSequence && isLive(m, now) && m.recipients[actor.id] !== undefined && !m.deletedFor.includes(actor.id))
      .sort((a, b) => a.sequence - b.sequence);
    return { messages: visible.slice(0, req.limit).map((m) => messageDto(m, actor.id)), hasMore: visible.length > req.limit };
  }

  /** "Delete for me" hides a message from one participant; it is removed outright once every recipient deleted it. */
  function deleteForMe(ctx: CommandContext, input: unknown): { messageId: string; removed: boolean } {
    const req = parse(deleteSchema, input);
    return runCommand<{ messageId: string; removed: boolean }>(deps, ctx, { name: 'comms.message.delete_for_me', flag: FLAGS.private, request: req }, () => {
      const { actor } = ctx;
      const msg = messages().get(req.messageId);
      if (!msg || msg.tenantId !== actor.tenantId || msg.recipients[actor.id] === undefined) throw notFound('COMMS.MESSAGE_NOT_FOUND', 'message not found');
      deps.authz.authorize(actor, 'comms.message:delete', { type: 'comms.message', id: msg.id, tenantId: msg.tenantId, participantIds: Object.keys(msg.recipients) });
      if (msg.deletedFor.includes(actor.id)) return { result: { messageId: msg.id, removed: false } };
      const deletedFor = [...msg.deletedFor, actor.id];
      if (Object.keys(msg.recipients).every((id) => deletedFor.includes(id))) {
        removeMessage(msg);
        return { result: { messageId: msg.id, removed: true }, events: [purgedEvent(msg)] };
      }
      messages().put({ ...msg, deletedFor }, msg.version);
      return { result: { messageId: msg.id, removed: false } };
    });
  }

  const purgedEvent = (m: Message) => ({
    type: 'comms.message.purged', aggregateType: 'message', aggregateId: m.id, revision: m.version + 1,
    payload: { threadId: m.threadId, messageId: m.id, sequence: m.sequence, attachmentIds: [...m.attachmentIds] },
  });

  function removeMessage(msg: Message): void {
    for (const id of msg.attachmentIds) {
      const att = attachments().get(id);
      if (att) attachments().delete(id, att.version);
    }
    messages().delete(msg.id, msg.version);
  }

  /** System sweeper: purges disappearing messages whose TTL elapsed, with their attachment metadata. */
  function expireDue(ctx: CommandContext): { purged: number } {
    return runCommand(deps, ctx, { name: 'comms.message.expire_due', flag: FLAGS.private, request: {} }, () => {
      deps.authz.authorize(ctx.actor, 'comms.message:purge', { type: 'comms.message', tenantId: ctx.actor.tenantId });
      const now = deps.clock.now();
      const due = messages().list((m) => m.tenantId === ctx.actor.tenantId && m.expiresAt !== undefined && m.expiresAt <= now).slice(0, PURGE_BATCH);
      for (const m of due) removeMessage(m);
      return {
        result: { purged: due.length },
        events: due.map(purgedEvent),
      };
    });
  }

  function setReceipts(ctx: CommandContext, input: unknown) {
    const req = parse(receiptSettingSchema, input);
    return runCommand(deps, ctx, { name: 'comms.receipt.set_enabled', flag: FLAGS.private, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.receipt:write', view);
      const self = view.self as Participant;
      if (req.expectedVersion !== undefined && req.expectedVersion !== self.version) throw conflict('STORE.VERSION_CONFLICT', 'participant changed since it was read');
      const saved = participants().put({ ...self, readReceipts: req.enabled, updatedAt: deps.clock.now() }, self.version);
      return { result: { threadId: saved.threadId, readReceipts: saved.readReceipts, version: saved.version } };
    });
  }

  /** The read position is always stored for the caller's own unread counts; it is shared only when opted in. */
  function mark(ctx: CommandContext, input: unknown) {
    const req = parse(markSchema, input);
    return runCommand(deps, ctx, { name: 'comms.receipt.mark', flag: FLAGS.private, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.receipt:write', view);
      const last = counters().get(req.threadId)?.last ?? 0;
      if (req.upToSequence > last) throw conflict('COMMS.SEQUENCE_UNKNOWN', 'sequence has not been issued yet', { last });
      const id = `${req.threadId}:${actor.id}`;
      const prior = marks().get(id);
      if (prior && prior.upToSequence >= req.upToSequence) return { result: { threadId: req.threadId, upToSequence: prior.upToSequence } };
      const saved = marks().put({ id, tenantId: actor.tenantId, threadId: req.threadId, accountId: actor.id, upToSequence: req.upToSequence, at: deps.clock.now() }, prior?.version ?? 0);
      const shared = (view.self as Participant).readReceipts;
      return {
        result: { threadId: saved.threadId, upToSequence: saved.upToSequence },
        events: shared
          ? [{ type: 'comms.receipt.marked', aggregateType: 'read_mark', aggregateId: saved.id, revision: saved.version, payload: { threadId: saved.threadId, accountId: actor.id, upToSequence: saved.upToSequence } }]
          : [],
      };
    });
  }

  function listReceipts(actor: Actor, input: unknown): { receipts: { accountId: string; upToSequence: number; at: number }[]; own?: number } {
    const req = parse(threadOnly, input);
    requireFeature(deps.flags, FLAGS.private, actor.tenantId);
    const view = loadThread(env, actor, req.threadId);
    authorizeThread(env, actor, 'comms.receipt:read', view);
    const sharing = new Set(withStatus(view, 'active').filter((p) => p.readReceipts && p.accountId !== actor.id).map((p) => p.accountId));
    const all = marks().list((m) => m.threadId === req.threadId);
    const own = all.find((m) => m.accountId === actor.id)?.upToSequence;
    return {
      receipts: all.filter((m) => sharing.has(m.accountId)).map((m) => ({ accountId: m.accountId, upToSequence: m.upToSequence, at: m.at })),
      ...(own !== undefined ? { own } : {}),
    };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.message.send', kind: 'command', flag: FLAGS.private, summary: 'Store an end-to-end encrypted message', handler: send },
    { name: 'comms.message.list', kind: 'query', flag: FLAGS.private, summary: 'List messages since a sequence number', handler: (ctx, input) => list(ctx.actor, input) },
    { name: 'comms.message.delete_for_me', kind: 'command', flag: FLAGS.private, summary: 'Delete a message for myself', handler: deleteForMe },
    { name: 'comms.message.expire_due', kind: 'command', flag: FLAGS.private, summary: 'System: purge expired disappearing messages', handler: (ctx) => expireDue(ctx) },
    { name: 'comms.receipt.set_enabled', kind: 'command', flag: FLAGS.private, summary: 'Opt in or out of sharing read receipts', handler: setReceipts },
    { name: 'comms.receipt.mark', kind: 'command', flag: FLAGS.private, summary: 'Record my read position', handler: mark },
    { name: 'comms.receipt.list', kind: 'query', flag: FLAGS.private, summary: 'Read positions of participants who opted in', handler: (ctx, input) => listReceipts(ctx.actor, input) },
  ]);

  return { send, list, deleteForMe, expireDue, setReceipts, mark, listReceipts, operations };
}
