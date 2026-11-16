import { appError, err, ok, uuidv7, z, type AppError, type Result } from '@classrup/kernel';
import { bucketBetween, cellsForRadius } from '../geoprivacy/coarse/index.ts';
import { DEFAULT_RANKING_CONFIG, rankCandidates } from '../ranking/relevance/scoring.ts';
import type { PublicListingProjection, RetainedListing } from './index.ts';

const amount = z.string().regex(/^(0|[1-9][0-9]{0,77})$/);
/** Local-cache filters: exact categories, declared minor units, and approximate cell overlap. */
export const localSearchOptionsSchema = z.strictObject({
  categoryId: uuidv7().optional(),
  kind: z.enum(['sell', 'wanted', 'giveaway']).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'for_parts']).optional(),
  price: z.strictObject({ currency: z.string().regex(/^[A-Z][A-Z0-9]{2,9}$/), min: amount.optional(), max: amount.optional() })
    .refine(p => p.min === undefined || p.max === undefined || BigInt(p.min) <= BigInt(p.max)).optional(),
  centerCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(),
  distanceKm: z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).optional(),
  seenWithinDays: z.union([z.literal(1), z.literal(7), z.literal(30)]).optional(),
  sort: z.enum(['retained', 'ranked']).default('retained'),
}).refine(o => o.distanceKm === undefined || o.centerCell !== undefined);
export type LocalSearchOptions = z.output<typeof localSearchOptionsSchema>;

export function localSearchPredicate(options: LocalSearchOptions, now: number): Result<(r: RetainedListing) => boolean, AppError> {
  let cells: string[] | undefined;
  if (options.distanceKm !== undefined && options.centerCell !== undefined) {
    const covered = cellsForRadius(options.centerCell, options.distanceKm);
    if (!covered.ok) return covered;
    cells = covered.value;
  }
  return ok(r => {
    const p = r.projection;
    if (!p || (options.categoryId && p.categoryId !== options.categoryId)
      || (options.kind && p.kind !== options.kind) || (options.condition && p.condition !== options.condition)) return false;
    if (options.seenWithinDays && Date.parse(r.observedAt) < now - options.seenWithinDays * 86_400_000) return false;
    if (options.price && (!p.value || p.value.currency !== options.price.currency
      || (options.price.min !== undefined && BigInt(p.value.amount) < BigInt(options.price.min))
      || (options.price.max !== undefined && BigInt(p.value.amount) > BigInt(options.price.max)))) return false;
    // A coarse published cell can overlap several covering cells. This is deliberately not an exact location test.
    return !cells || cells.some(c => c.startsWith(p.regionCell) || p.regionCell.startsWith(c));
  });
}

/** No FTS index exists here: rank matching records by local first observation and optional coarse distance only. */
export function rankRetainedListings(items: RetainedListing[], options: LocalSearchOptions, now: number): Result<RetainedListing[], AppError> {
  if (options.sort !== 'ranked') return ok(items);
  const byId = new Map(items.map(r => [`${r.ownerId}/${r.listingId}`, r]));
  const candidates = [];
  for (const [documentId, r] of byId) {
    const p = r.projection as PublicListingProjection;
    const distance = options.centerCell ? bucketBetween(p.regionCell, options.centerCell) : undefined;
    if (distance && !distance.ok) return distance;
    candidates.push({ documentId, firstSeenAt: r.observedAt, ...(distance?.ok ? { distanceBucket: distance.value } : {}) });
  }
  const ranked = rankCandidates(candidates, DEFAULT_RANKING_CONFIG, {
    now, hasText: false, hasDistance: options.centerCell !== undefined, promotionEnabled: false,
  });
  if (!ranked.ok) return ranked;
  const result: RetainedListing[] = [];
  for (const candidate of ranked.value) {
    const record = byId.get(candidate.documentId);
    if (!record) return err(appError('VALIDATION_FAILED'));
    result.push(record);
  }
  return ok(result);
}
