/**
 * F08.S02.M01 offers: structured negotiation cards inside a thread. A card points at a canonical offer,
 * trade proposal or cycle owned by bazaar/mutiny (by id and revision hash); it never copies or changes terms.
 * A new revision supersedes the previous card, so consent given to an older revision never carries over.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { conflict, defineOperations, parse, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import { assertRefId, hashSchema, threadIdSchema } from '../schemas';
import type { Env } from '../support';
import { authorizeThread, col, COLLECTIONS, FLAGS, loadThread, notifyEach, withStatus } from '../support';
import type { Card, CardRefType, ThreadCounter } from '../types';

const CARD_REF_TYPES = ['offer', 'proposal', 'cycle'] as const satisfies readonly CardRefType[];

const postSchema = z.strictObject({
  threadId: threadIdSchema,
  refType: z.enum(CARD_REF_TYPES),
  refId: z.string().max(64),
  revisionHash: hashSchema,
  summary: schemas.text(1, 280),
});
const listSchema = z.strictObject({ threadId: threadIdSchema });

export interface CardDto {
  readonly id: string;
  readonly threadId: string;
  readonly postedBy: string;
  readonly refType: CardRefType;
  readonly refId: string;
  readonly revisionHash: string;
  readonly summary: string;
  readonly status: Card['status'];
  readonly afterSequence: number;
  readonly createdAt: number;
}

const dto = (c: Card): CardDto => ({
  id: c.id, threadId: c.threadId, postedBy: c.postedBy, refType: c.refType, refId: c.refId, revisionHash: c.revisionHash, summary: c.summary,
  status: c.status, afterSequence: c.afterSequence, createdAt: c.createdAt,
});

export function createOffers(env: Env) {
  const { deps } = env;
  const cards = () => col<Card>(env, COLLECTIONS.cards);

  function post(ctx: CommandContext, input: unknown): CardDto {
    const req = parse(postSchema, input);
    return runCommand(deps, ctx, { name: 'comms.card.post', flag: FLAGS.offers, request: req }, () => {
      const { actor } = ctx;
      assertRefId(req.refType, req.refId);
      const view = loadThread(env, actor, req.threadId);
      authorizeThread(env, actor, 'comms.card:post', view);
      const existing = cards().list((c) => c.threadId === req.threadId && c.refType === req.refType && c.refId === req.refId);
      if (existing.some((c) => c.revisionHash === req.revisionHash)) {
        throw conflict('COMMS.CARD_DUPLICATE', 'this revision already has a card in the thread');
      }
      for (const c of existing.filter((x) => x.status === 'current')) cards().put({ ...c, status: 'superseded' }, c.version);
      const saved = cards().put(
        {
          id: deps.ids.next('msg'), tenantId: actor.tenantId, threadId: req.threadId, postedBy: actor.id, refType: req.refType, refId: req.refId,
          revisionHash: req.revisionHash, summary: req.summary, status: 'current',
          afterSequence: col<ThreadCounter>(env, COLLECTIONS.counters).get(req.threadId)?.last ?? 0, createdAt: deps.clock.now(),
        },
        0,
      );
      notifyEach(env, actor.tenantId, withStatus(view, 'active').filter((p) => p.accountId !== actor.id && !p.muted).map((p) => p.accountId), 'comms.card', 'comms.card.posted', {
        threadId: saved.threadId,
      });
      return {
        result: dto(saved),
        events: [
          { type: 'comms.card.posted', aggregateType: 'card', aggregateId: saved.id, revision: saved.version, payload: { threadId: saved.threadId, cardId: saved.id, refType: saved.refType, refId: saved.refId, revisionHash: saved.revisionHash } },
        ],
      };
    });
  }

  function list(actor: Actor, input: unknown): { cards: CardDto[] } {
    const req = parse(listSchema, input);
    requireFeature(deps.flags, FLAGS.offers, actor.tenantId);
    authorizeThread(env, actor, 'comms.card:read', loadThread(env, actor, req.threadId));
    return { cards: cards().list((c) => c.threadId === req.threadId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).map(dto) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'comms.card.post', kind: 'command', flag: FLAGS.offers, summary: 'Post a negotiation card for an offer, proposal or cycle revision', handler: post },
    { name: 'comms.card.list', kind: 'query', flag: FLAGS.offers, summary: 'List negotiation cards of a thread', handler: (ctx, input) => list(ctx.actor, input) },
  ]);

  return { post, list, operations };
}
