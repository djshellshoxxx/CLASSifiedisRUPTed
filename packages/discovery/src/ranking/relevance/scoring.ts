// Pure relevance scoring (F06.S03.M01). No I/O, no clock reads: `now` is passed in, so the vault and a relay
// compute the same order from the same inputs. Uses only public document fields and a coarse distance bucket.
import { appError, boundedString, err, ok, timestamp, z, type AppError, type Result } from '@classrup/kernel';

export const DISTANCE_BUCKETS = ['lt5', '5_10', '10_25', '25_50', 'gt50'] as const;
export type DistanceBucket = (typeof DISTANCE_BUCKETS)[number];
export const PROMOTION_CAP_MULTIPLIER = 1.25;
export const DAY_MS = 86_400_000;

const finite = (min: number, max: number) => z.number().min(min).max(max);
export const rankingParamsShape = {
  weights: z.strictObject({ text: finite(0.05, 0.9), recency: finite(0.05, 0.9), distance: finite(0.05, 0.9) }),
  bm25: z.strictObject({ titleWeight: finite(1, 10), bodyWeight: finite(1, 10), k: finite(1, 10) }),
  recencyHalfLifeDays: z.int().min(1).max(90),
  distanceWeights: z.strictObject({ lt5: finite(0.05, 1), '5_10': finite(0.05, 1), '10_25': finite(0.05, 1), '25_50': finite(0.05, 1), gt50: finite(0.05, 1) }),
  promotionBoost: finite(0, 0.25),
};
type ParamsLike = { weights: { text: number; recency: number; distance: number }; distanceWeights: RankingParamsInner['distanceWeights'] };
type RankingParamsInner = { distanceWeights: { lt5: number; '5_10': number; '10_25': number; '25_50': number; gt50: number } };
export const weightsSumToOne = (p: ParamsLike): boolean => Math.abs(p.weights.text + p.weights.recency + p.weights.distance - 1) <= 1e-9;
export const distanceNonIncreasing = (p: ParamsLike): boolean => { const d = p.distanceWeights; return d.lt5 >= d['5_10'] && d['5_10'] >= d['10_25'] && d['10_25'] >= d['25_50'] && d['25_50'] >= d.gt50; };
export const rankingParamsSchema = z.strictObject(rankingParamsShape)
  .refine(weightsSumToOne, { message: 'weights must sum to 1.0' })
  .refine(distanceNonIncreasing, { message: 'distance weights must be non-increasing' });
export type RankingParams = z.output<typeof rankingParamsSchema>;
export const reasonNoteSchema = boundedString({ max: 280 });

/** The subset of a RankingConfig the pure functions need. */
export interface ScoringConfig extends RankingParams { readonly origin: 'bundled' | 'relay_published'; readonly version: number; }

export const DEFAULT_RANKING_PARAMS: RankingParams = Object.freeze({
  weights: { text: 0.6, recency: 0.25, distance: 0.15 }, bm25: { titleWeight: 5, bodyWeight: 1, k: 3 }, recencyHalfLifeDays: 14,
  distanceWeights: { lt5: 1, '5_10': 0.85, '10_25': 0.65, '25_50': 0.4, gt50: 0.2 }, promotionBoost: 0.15,
});
export const DEFAULT_RANKING_CONFIG: ScoringConfig = Object.freeze({ ...DEFAULT_RANKING_PARAMS, origin: 'bundled' as const, version: 1 });

export const candidateSchema = z.strictObject({
  documentId: boundedString({ min: 1, max: 200 }),
  firstSeenAt: timestamp(),
  claimedPublishedAt: timestamp().optional(),
  /** Raw FTS5 bm25() value: zero or negative, more negative is a better match. Absent when the query has no text terms. */
  bm25: z.number().max(0).optional(),
  distanceBucket: z.enum(DISTANCE_BUCKETS).optional(),
  promoted: z.boolean().optional(),
  promotedUntil: timestamp().optional(),
});
export type RankCandidate = z.input<typeof candidateSchema>;

export interface ScoreContext {
  /** Epoch milliseconds from the injected clock. */
  readonly now: number;
  /** False for a browse query with no text terms: the text term is dropped and weights renormalized. */
  readonly hasText: boolean;
  /** False when there is no reference region for the query: the distance term is dropped and weights renormalized. */
  readonly hasDistance: boolean;
  /** True only on a relay that chose to sell promotion; otherwise a promoted flag is ignored. */
  readonly promotionEnabled: boolean;
}

export interface ExplainKey { readonly key: string; readonly params: Readonly<Record<string, string | number>>; }
export interface ScoreComponents {
  readonly text: number | null; readonly recency: number; readonly distance: number | null;
  readonly weights: { readonly text: number; readonly recency: number; readonly distance: number };
  readonly ageDays: number; readonly base: number; readonly multiplier: number; readonly final: number;
  readonly promotedApplied: boolean; readonly distanceBucket: DistanceBucket | null;
}
export interface ScoreExplanation { readonly documentId: string; readonly components: ScoreComponents; readonly explain: readonly ExplainKey[]; readonly promotedLabel: boolean; }
export interface ScoredCandidate extends ScoreExplanation { readonly score: number; readonly firstSeenAt: string; }

const invalid = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });
const round6 = (x: number): number => Math.round(x * 1e6) / 1e6;

export function explainComponents(candidate: unknown, config: ScoringConfig, ctx: ScoreContext): Result<ScoreExplanation, AppError> {
  if (!Number.isFinite(ctx.now)) return err(invalid('now', 'NOT_FINITE'));
  const parsed = candidateSchema.safeParse(candidate);
  if (!parsed.success) return err(appError('VALIDATION_FAILED', { fields: parsed.error.issues.map(i => ({ path: i.path.join('.'), code: i.code })) }));
  const c = parsed.data;
  if (ctx.hasText && c.bm25 === undefined) return err(invalid('bm25', 'REQUIRED'));
  if (ctx.hasDistance && c.distanceBucket === undefined) return err(invalid('distanceBucket', 'REQUIRED'));
  const first = Date.parse(c.firstSeenAt);
  // Recency is anchored on the local first-seen time; a claim can only move the anchor earlier, never later.
  const anchor = c.claimedPublishedAt === undefined ? first : Math.min(first, Date.parse(c.claimedPublishedAt));
  const ageDays = Math.max(0, ctx.now - anchor) / DAY_MS;
  const recency = Math.pow(0.5, ageDays / config.recencyHalfLifeDays);
  let text: number | null = null;
  if (ctx.hasText) { const s = -(c.bm25 as number); text = s / (s + config.bm25.k); }
  const bucket = ctx.hasDistance ? (c.distanceBucket as DistanceBucket) : null;
  const distance = bucket === null ? null : config.distanceWeights[bucket];
  const wText = ctx.hasText ? config.weights.text : 0;
  const wDist = ctx.hasDistance ? config.weights.distance : 0;
  const total = wText + config.weights.recency + wDist;
  const weights = { text: wText / total, recency: config.weights.recency / total, distance: wDist / total };
  const base = weights.text * (text ?? 0) + weights.recency * recency + weights.distance * (distance ?? 0);
  // Fail closed: promotion applies only when the relay sells it and an unexpired promotedUntil is present.
  const promotedApplied = ctx.promotionEnabled && c.promoted === true && c.promotedUntil !== undefined && Date.parse(c.promotedUntil) > ctx.now;
  const multiplier = promotedApplied ? Math.min(1 + config.promotionBoost, PROMOTION_CAP_MULTIPLIER) : 1;
  const final = round6(base * multiplier);
  const explain: ExplainKey[] = [];
  if (text !== null && text > 0) explain.push({ key: 'discovery.explain.text_match', params: {} });
  if (recency >= 0.5) explain.push({ key: 'discovery.explain.recent', params: { ageDays: Math.floor(ageDays) } });
  if (bucket !== null) explain.push({ key: 'discovery.explain.distance_bucket', params: { bucket } });
  if (promotedApplied) explain.push({ key: 'discovery.explain.promoted', params: {} });
  if (config.origin === 'bundled') explain.push({ key: 'discovery.explain.default_ranking', params: { version: config.version } });
  return ok({ documentId: c.documentId, components: { text, recency, distance, weights, ageDays, base, multiplier, final, promotedApplied, distanceBucket: bucket }, explain, promotedLabel: promotedApplied });
}

export function score(candidate: unknown, config: ScoringConfig, ctx: ScoreContext): Result<number, AppError> {
  const e = explainComponents(candidate, config, ctx);
  return e.ok ? ok(e.value.components.final) : e;
}

/** Fixed order: higher score first; equal scores (already rounded to six decimals) prefer the newer firstSeenAt, then the smaller documentId. */
export function compareScored(a: { score: number; firstSeenAt: string; documentId: string }, b: { score: number; firstSeenAt: string; documentId: string }): number {
  if (a.score !== b.score) return b.score - a.score;
  const fa = Date.parse(a.firstSeenAt); const fb = Date.parse(b.firstSeenAt);
  if (fa !== fb) return fb - fa;
  return a.documentId < b.documentId ? -1 : a.documentId > b.documentId ? 1 : 0;
}

export function rankCandidates(candidates: readonly unknown[], config: ScoringConfig, ctx: ScoreContext): Result<ScoredCandidate[], AppError> {
  const out: ScoredCandidate[] = [];
  const seen = new Set<string>();
  for (const [i, raw] of candidates.entries()) {
    const e = explainComponents(raw, config, ctx);
    if (!e.ok) return e;
    if (seen.has(e.value.documentId)) return err(invalid(`candidates.${i}.documentId`, 'DUPLICATE'));
    seen.add(e.value.documentId);
    out.push({ ...e.value, score: e.value.components.final, firstSeenAt: (raw as { firstSeenAt: string }).firstSeenAt });
  }
  return ok(out.sort(compareScored));
}

/** Region functions are supplied by the geoprivacy module through the composition root; only coarse cells cross this port. */
export interface RegionPort { cellDistanceKm(fromCell: string, toCell: string): number; }
export function distanceBucketForKm(km: number): DistanceBucket | undefined {
  if (!Number.isFinite(km) || km < 0) return undefined;
  return km < 5 ? 'lt5' : km < 10 ? '5_10' : km < 25 ? '10_25' : km < 50 ? '25_50' : 'gt50';
}
const CELL_RE = /^[0123456789bcdefghjkmnpqrstuvwxyz]{1,5}$/;
export function distanceBucketBetweenCells(region: RegionPort, documentCell: string, queryCell: string): Result<DistanceBucket, AppError> {
  if (!CELL_RE.test(documentCell) || !CELL_RE.test(queryCell)) return err(invalid('regionCell', 'INVALID_CELL'));
  const bucket = distanceBucketForKm(region.cellDistanceKm(documentCell, queryCell));
  return bucket === undefined ? err(invalid('regionCell', 'INVALID_DISTANCE')) : ok(bucket);
}
