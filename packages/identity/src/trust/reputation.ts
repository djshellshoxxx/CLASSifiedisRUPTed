/**
 * F07.S03.M01 reputation: one rating per (rater, subject), only between verified counterparties.
 * The public score is a Bayesian average so a single 5-star rating cannot outrank a long record.
 */
import type { CommandContext } from '@classrup/kernel';
import { assertVersion, DAY, forbidden, notFound, parse, precondition, conflict, runCommand, schemas, z } from '@classrup/kernel';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, deriveId, EVENTS, event, FLAGS, requireAccount } from '../env';
import type { FeedbackRecord, ReputationRecord } from '../records';
import { accountIdSchema, expectedVersionSchema, pageSchema } from '../schemas';

export const PRIOR_MEAN = 3.5;
export const PRIOR_WEIGHT = 5;
export const FEEDBACK_EDIT_WINDOW_MS = 14 * DAY;

type Histogram = ReputationRecord['histogram'];
const EMPTY_HISTOGRAM: Histogram = [0, 0, 0, 0, 0];

/** (priorWeight * priorMean + sum) / (priorWeight + count), rounded to 3 decimals. */
export function bayesianScore(sum: number, count: number, priorMean = PRIOR_MEAN, priorWeight = PRIOR_WEIGHT): number {
  return Math.round(((priorWeight * priorMean + sum) / (priorWeight + count)) * 1000) / 1000;
}

export interface ReputationDto {
  readonly accountId: string;
  readonly count: number;
  /** Plain mean of ratings, null before the first rating. */
  readonly average: number | null;
  readonly score: number;
  readonly histogram: Histogram;
  readonly prior: { readonly mean: number; readonly weight: number };
}

export interface FeedbackDto {
  readonly id: string;
  readonly raterId: string;
  readonly raterPseudonym: string;
  readonly rateeId: string;
  readonly subjectType: string;
  readonly rating: number;
  readonly comment?: string;
  readonly edited: boolean;
  readonly createdAt: number;
  readonly version: number;
}

const bump = (h: Histogram, rating: number, by: 1 | -1): Histogram =>
  h.map((n, i) => (i === rating - 1 ? n + by : n)) as unknown as Histogram;

export const toReputationDto = (accountId: string, r: ReputationRecord | undefined): ReputationDto => {
  const count = r?.count ?? 0;
  const sum = r?.sum ?? 0;
  return {
    accountId,
    count,
    average: count === 0 ? null : Math.round((sum / count) * 1000) / 1000,
    score: bayesianScore(sum, count),
    histogram: r?.histogram ?? EMPTY_HISTOGRAM,
    prior: { mean: PRIOR_MEAN, weight: PRIOR_WEIGHT },
  };
};

const ratingSchema = z.number().int().min(1).max(5);
const subjectTypeSchema = z.string().regex(/^[a-z][a-z0-9_]{1,31}$/);
const commentSchema = schemas.text(1, 280);

const submitSchema = z
  .object({ rateeId: accountIdSchema, subjectType: subjectTypeSchema, subjectId: z.string().min(1).max(64), rating: ratingSchema, comment: commentSchema.optional() })
  .strict();
const editSchema = z
  .object({ feedbackId: schemas.id('rep'), rating: ratingSchema.optional(), comment: commentSchema.nullable().optional(), expectedVersion: expectedVersionSchema })
  .strict()
  .refine((v) => v.rating !== undefined || v.comment !== undefined, 'nothing to change');
const removeSchema = z.object({ feedbackId: schemas.id('rep'), reason: schemas.text(3, 200) }).strict();
const listSchema = z.object({ accountId: accountIdSchema, ...pageSchema }).strict();
const getSchema = z.object({ accountId: accountIdSchema }).strict();

export interface ReputationService {
  submit(ctx: CommandContext, input: z.input<typeof submitSchema>): FeedbackDto;
  edit(ctx: CommandContext, input: z.input<typeof editSchema>): FeedbackDto;
  remove(ctx: CommandContext, input: z.input<typeof removeSchema>): { removed: true };
  list(ctx: CommandContext, input: z.input<typeof listSchema>): FeedbackDto[];
  get(ctx: CommandContext, input: z.input<typeof getSchema>): ReputationDto;
}

const indexKey = (raterId: string, subjectType: string, subjectId: string): string => `${raterId}|${subjectType}|${subjectId}`;

export function createReputationService(env: IdentityEnv): ReputationService {
  const { deps, stores, ports } = env;

  const pseudonymOf = (accountId: string): string => stores.accounts.get(accountId)?.pseudonym ?? 'deleted';

  const toFeedbackDto = (f: FeedbackRecord): FeedbackDto => ({
    id: f.id,
    raterId: f.raterId,
    raterPseudonym: pseudonymOf(f.raterId),
    rateeId: f.rateeId,
    subjectType: f.subjectType,
    rating: f.rating,
    ...(f.comment !== undefined ? { comment: f.comment } : {}),
    edited: f.updatedAt > f.createdAt,
    createdAt: f.createdAt,
    version: f.version,
  });

  /** Applies a rating delta to the ratee's aggregate inside the caller's transaction. */
  function adjustAggregate(tenantId: string, accountId: string, change: { add?: number; remove?: number }): void {
    const id = deriveId('rep', accountId);
    const current = stores.reputation.get(id);
    let histogram = current?.histogram ?? EMPTY_HISTOGRAM;
    let count = current?.count ?? 0;
    let sum = current?.sum ?? 0;
    if (change.remove !== undefined) {
      histogram = bump(histogram, change.remove, -1);
      count -= 1;
      sum -= change.remove;
    }
    if (change.add !== undefined) {
      histogram = bump(histogram, change.add, 1);
      count += 1;
      sum += change.add;
    }
    stores.reputation.put({ id, tenantId, accountId, count, sum, histogram }, current?.version ?? 0);
  }

  function requireFeedback(ctx: CommandContext, id: string): FeedbackRecord {
    const f = stores.feedback.get(id);
    if (!f || f.tenantId !== ctx.actor.tenantId || f.status !== 'active') throw notFound('IDENTITY.FEEDBACK_NOT_FOUND', 'feedback not found');
    return f;
  }

  return {
    submit(ctx, input) {
      const i = parse(submitSchema, input);
      authorize(env, ctx, 'identity.feedback:submit', { type: 'feedback', tenantId: ctx.actor.tenantId, ownerId: ctx.actor.id });
      return runCommand(deps, ctx, { name: 'identity.feedback.submit', flag: FLAGS.reputation, request: i }, () => {
        const raterId = ctx.actor.id;
        if (i.rateeId === raterId) throw forbidden('IDENTITY.SELF_RATING', 'you cannot rate yourself');
        const ratee = requireAccount(env, i.rateeId, ctx.actor.tenantId);
        if (ratee.status !== 'active') throw precondition('IDENTITY.RATEE_INACTIVE', 'account cannot receive feedback');
        if (ports.blocks.isBlocked(raterId, i.rateeId)) throw forbidden('IDENTITY.BLOCKED', 'feedback is not available between these accounts');
        if (!ports.interactions.wasCounterparty(raterId, i.rateeId, i.subjectType, i.subjectId)) {
          throw forbidden('IDENTITY.NOT_COUNTERPARTY', 'feedback requires a completed interaction with this account');
        }
        const key = indexKey(raterId, i.subjectType, i.subjectId);
        if (stores.feedbackIndex.get(key)) throw conflict('IDENTITY.FEEDBACK_EXISTS', 'feedback already given for this subject');

        const now = deps.clock.now();
        const id = deps.ids.next('rep');
        const stored = stores.feedback.put(
          {
            id,
            tenantId: ctx.actor.tenantId,
            raterId,
            rateeId: i.rateeId,
            subjectType: i.subjectType,
            subjectId: i.subjectId,
            rating: i.rating,
            ...(i.comment !== undefined ? { comment: i.comment } : {}),
            status: 'active',
            createdAt: now,
            updatedAt: now,
          },
          0,
        );
        stores.feedbackIndex.put({ id: key, feedbackId: id }, 0);
        adjustAggregate(ctx.actor.tenantId, i.rateeId, { add: i.rating });
        return {
          result: toFeedbackDto(stored),
          // The comment text is deliberately not part of the event.
          events: [
            event(EVENTS.feedbackSubmitted, 'feedback', id, stored.version, {
              feedbackId: id,
              raterId,
              rateeId: i.rateeId,
              subjectType: i.subjectType,
              rating: i.rating,
            }),
          ],
        };
      });
    },

    edit(ctx, input) {
      const i = parse(editSchema, input);
      const existing = requireFeedback(ctx, i.feedbackId);
      authorize(env, ctx, 'identity.feedback:edit', { type: 'feedback', id: existing.id, ownerId: existing.raterId, tenantId: existing.tenantId });
      return runCommand(deps, ctx, { name: 'identity.feedback.edit', flag: FLAGS.reputation, request: i }, () => {
        const f = requireFeedback(ctx, i.feedbackId);
        assertVersion('feedback', f.version, i.expectedVersion);
        const now = deps.clock.now();
        if (now - f.createdAt > FEEDBACK_EDIT_WINDOW_MS) throw precondition('IDENTITY.FEEDBACK_LOCKED', 'feedback can only be edited within 14 days');
        const rating = i.rating ?? f.rating;
        const comment = i.comment === undefined ? f.comment : (i.comment ?? undefined);
        const stored = stores.feedback.put({ ...f, rating, comment, updatedAt: now }, f.version);
        if (rating !== f.rating) adjustAggregate(f.tenantId, f.rateeId, { remove: f.rating, add: rating });
        return {
          result: toFeedbackDto(stored),
          events: [event(EVENTS.feedbackEdited, 'feedback', f.id, stored.version, { feedbackId: f.id, rateeId: f.rateeId, rating })],
        };
      });
    },

    remove(ctx, input) {
      const i = parse(removeSchema, input);
      authorize(env, ctx, 'identity.feedback:remove', { type: 'feedback', id: i.feedbackId, tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'identity.feedback.remove', flag: FLAGS.reputation, request: i }, () => {
        const f = requireFeedback(ctx, i.feedbackId);
        const stored = stores.feedback.put({ ...f, status: 'removed', updatedAt: deps.clock.now() }, f.version);
        adjustAggregate(f.tenantId, f.rateeId, { remove: f.rating });
        return {
          result: { removed: true as const },
          events: [event(EVENTS.feedbackRemoved, 'feedback', f.id, stored.version, { feedbackId: f.id, rateeId: f.rateeId, reason: i.reason })],
        };
      });
    },

    list(ctx, input) {
      const i = parse(listSchema, input);
      authorize(env, ctx, 'identity.feedback:read', { type: 'feedback', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.reputation);
      return stores.feedback
        .list((f) => f.rateeId === i.accountId && f.tenantId === ctx.actor.tenantId && f.status === 'active')
        .sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1))
        .slice(i.offset, i.offset + i.limit)
        .map(toFeedbackDto);
    },

    get(ctx, input) {
      const i = parse(getSchema, input);
      authorize(env, ctx, 'identity.reputation:read', { type: 'reputation', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.reputation);
      requireAccount(env, i.accountId, ctx.actor.tenantId);
      return toReputationDto(i.accountId, stores.reputation.get(deriveId('rep', i.accountId)));
    },
  };
}
