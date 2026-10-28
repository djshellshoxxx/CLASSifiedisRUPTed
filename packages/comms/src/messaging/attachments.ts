/**
 * F08.S01.M03 attachments: metadata for encrypted blobs. The blob is encrypted by the client before upload,
 * its content key travels inside message ciphertext, and the relay records only hash, size and mime type.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { conflict, defineOperations, HOUR, notFound, parse, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import { hashSchema, threadIdSchema } from '../schemas';
import type { Env } from '../support';
import { authorizeThread, col, COLLECTIONS, FLAGS, loadThread } from '../support';
import type { Attachment } from '../types';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
/** An attachment not referenced by a message within this window is discarded. */
export const PENDING_TTL_MS = 24 * HOUR;
const MAX_PENDING_PER_ACTOR = 20;

const registerSchema = z.strictObject({
  threadId: threadIdSchema,
  contentHash: hashSchema,
  sizeBytes: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES),
  mime: z.enum(ALLOWED_MIME),
});
const getSchema = z.strictObject({ attachmentId: schemas.id('att') });

export interface AttachmentDto {
  readonly id: string;
  readonly threadId: string;
  readonly uploaderId: string;
  readonly contentHash: string;
  readonly sizeBytes: number;
  readonly mime: string;
  readonly status: Attachment['status'];
  readonly messageId?: string;
}

const dto = (a: Attachment): AttachmentDto => ({
  id: a.id, threadId: a.threadId, uploaderId: a.uploaderId, contentHash: a.contentHash, sizeBytes: a.sizeBytes, mime: a.mime, status: a.status,
  ...(a.messageId ? { messageId: a.messageId } : {}),
});

export function createAttachments(env: Env) {
  const { deps } = env;
  const attachments = () => col<Attachment>(env, COLLECTIONS.attachments);

  function register(ctx: CommandContext, input: unknown): AttachmentDto {
    const req = parse(registerSchema, input);
    return runCommand(deps, ctx, { name: 'comms.attachment.register', flag: FLAGS.attachments, request: req }, () => {
      const { actor } = ctx;
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.attachment:register', view);
      const pending = attachments().count((a) => a.uploaderId === actor.id && a.status === 'pending');
      if (pending >= MAX_PENDING_PER_ACTOR) throw conflict('COMMS.ATTACHMENT_QUOTA', 'too many unsent attachments');
      const saved = attachments().put(
        {
          id: deps.ids.next('att'), tenantId: actor.tenantId, threadId: req.threadId, uploaderId: actor.id, contentHash: req.contentHash,
          sizeBytes: req.sizeBytes, mime: req.mime, status: 'pending', createdAt: deps.clock.now(),
        },
        0,
      );
      return {
        result: dto(saved),
        events: [
          { type: 'comms.attachment.registered', aggregateType: 'attachment', aggregateId: saved.id, revision: saved.version, payload: { threadId: saved.threadId, attachmentId: saved.id, contentHash: saved.contentHash, sizeBytes: saved.sizeBytes, mime: saved.mime } },
        ],
      };
    });
  }

  function get(actor: Actor, input: unknown): AttachmentDto {
    const req = parse(getSchema, input);
    requireFeature(deps.flags, FLAGS.attachments, actor.tenantId);
    const att = attachments().get(req.attachmentId);
    if (!att || att.tenantId !== actor.tenantId) throw notFound('COMMS.ATTACHMENT_NOT_FOUND', 'attachment not found');
    authorizeThread(env, actor, 'comms.attachment:read', loadThread(env, actor, att.threadId));
    return dto(att);
  }

  /** System sweeper: discards attachments never referenced by a message so blobs can be garbage-collected. */
  function expireDue(ctx: CommandContext): { expired: number } {
    return runCommand(deps, ctx, { name: 'comms.attachment.expire_due', flag: FLAGS.attachments, request: {} }, () => {
      deps.authz.authorize(ctx.actor, 'comms.attachment:purge', { type: 'comms.attachment', tenantId: ctx.actor.tenantId });
      const cutoff = deps.clock.now() - PENDING_TTL_MS;
      const stale = attachments().list((a) => a.tenantId === ctx.actor.tenantId && a.status === 'pending' && a.createdAt <= cutoff);
      for (const a of stale) attachments().delete(a.id, a.version);
      return {
        result: { expired: stale.length },
        events: stale.map((a) => ({
          type: 'comms.attachment.expired', aggregateType: 'attachment', aggregateId: a.id, revision: a.version + 1,
          payload: { threadId: a.threadId, attachmentId: a.id, contentHash: a.contentHash },
        })),
      };
    });
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.attachment.register', kind: 'command', flag: FLAGS.attachments, summary: 'Register encrypted attachment metadata', handler: register },
    { name: 'comms.attachment.get', kind: 'query', flag: FLAGS.attachments, summary: 'Read attachment metadata', handler: (ctx, input) => get(ctx.actor, input) },
    { name: 'comms.attachment.expire_due', kind: 'command', flag: FLAGS.attachments, summary: 'System: discard unsent attachments', handler: (ctx) => expireDue(ctx) },
  ]);

  return { register, get, expireDue, operations };
}
