// F06.S03.M02 Ranking fairness: a pure re-ranking library applied after relevance scoring (F06.S03.M01).
// No commands, queries, events or stored state. Inputs are public document fields only; user identity, history,
// reputation and protected attributes cannot enter (candidate objects are strict). Deterministic: same input, same output.
import { appError, boundedString, defineErrors, err, ok, timestamp, z, type AppError, type Result } from '@classrup/kernel';

export const fairnessErrors = defineErrors({
  FAIRNESS_PROMOTION_NOT_ALLOWED: { status: 422, retryable: false },
  FAIRNESS_INPUT_UNSORTED: { status: 422, retryable: false },
});

/** Code-level constants; changing one needs a decision record and a library version bump (see the golden test). */
export const FAIRNESS_CONSTANTS = Object.freeze({
  version: 1, windowSize: 200, defaultPageSize: 20, minPageSize: 1, maxPageSize: 50, maxPerAuthorPerPage: 3,
  newAuthorWindowDays: 30, newAuthorSlotsPer20: 2, newAuthorMinScoreRatio: 0.5, promotedMaxShare: 0.2,
});
export const EXPLAIN_KEYS = Object.freeze({
  textMatch: 'discovery.explain.text_match', recent: 'discovery.explain.recent', distanceBucket: 'discovery.explain.distance_bucket', promoted: 'discovery.explain.promoted',
  newAuthorSlot: 'discovery.explain.new_author_slot', onlySeller: 'discovery.explain.only_seller', defaultRanking: 'discovery.explain.default_ranking',
});
const DAY_MS = 86_400_000;
const C = FAIRNESS_CONSTANTS;

const part = z.number().min(0);
export const fairnessCandidateSchema = z.strictObject({
  documentId: boundedString({ min: 1, max: 200 }),
  authorDid: boundedString({ min: 1, max: 200 }),
  score: part,
  promoted: z.boolean(),
  /** First time this index saw the author; a local observation, not an author claim. */
  authorFirstSeenAt: timestamp(),
  /** First time this index saw the document; used for the documented tie-break. */
  firstSeenAt: timestamp(),
  components: z.strictObject({
    text: part.nullable(), recency: part, distance: part.nullable(),
    matchField: z.enum(['title', 'body']).optional(), distanceBucket: z.enum(['lt5', '5_10', '10_25', '25_50', 'gt50']).optional(),
    ageDays: part.optional(), defaultRanking: z.boolean().optional(),
  }),
});
export type FairnessCandidate = z.output<typeof fairnessCandidateSchema>;

export interface ExplainEntry { readonly key: string; readonly params: Readonly<Record<string, string | number>>; }
export interface RerankedItem {
  readonly documentId: string; readonly authorDid: string; readonly score: number;
  /** True only for a promoted result that is shown as promoted (carries the Promoted label). */
  readonly promoted: boolean; readonly newAuthorSlot: boolean; readonly onlySeller: boolean;
  readonly explain: readonly ExplainEntry[];
}
export interface FairnessStats { readonly authorCapped: number; readonly newAuthorSlotsFilled: number; readonly promotedDemoted: number; }
export interface RerankResult { readonly items: readonly RerankedItem[]; /** Start of the next page in the re-ranked window, or null at the end. */ readonly nextWindowPosition: number | null; readonly stats: FairnessStats; }
export interface PageParams { readonly pageSize?: number; readonly windowPosition?: number; }
export interface RerankOptions {
  /** Epoch ms from the injected clock. */
  readonly now: number;
  /** True only when the index sells promotion; a promoted flag anywhere else is rejected. */
  readonly promotionEnabled: boolean;
}

const invalid = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });
const promotedCap = (pageSize: number): number => Math.floor(pageSize * C.promotedMaxShare + 1e-9);
const slotCount = (pageSize: number): number => (pageSize >= 5 ? Math.max(1, Math.floor((pageSize * C.newAuthorSlotsPer20) / 20)) : 0);
/** Slot positions (0-based) inside a page: 5 and 12 for 20 results. */
export function newAuthorSlotPositions(pageSize: number): number[] {
  const n = slotCount(pageSize);
  if (n === 0) return [];
  const base = Math.floor(pageSize / 4);
  const step = Math.max(1, n > 1 ? Math.min(Math.floor((pageSize * 7) / 20), Math.floor((pageSize - 1 - base) / (n - 1))) : 1);
  return Array.from({ length: n }, (_, i) => Math.min(base + i * step, pageSize - 1));
}

function before(a: FairnessCandidate, b: FairnessCandidate): boolean {
  if (a.score !== b.score) return a.score > b.score;
  const fa = Date.parse(a.firstSeenAt); const fb = Date.parse(b.firstSeenAt);
  if (fa !== fb) return fa > fb;
  return a.documentId < b.documentId;
}

interface Entry { readonly c: FairnessCandidate; readonly index: number; }
interface Built { readonly entries: { e: Entry; slot: boolean }[]; readonly stats: FairnessStats; readonly onlySeller: boolean; }

function buildPage(pool: Entry[], pageSize: number, now: number): Built {
  const cap = promotedCap(pageSize);
  const top = (pool[0] as Entry).c.score;
  const isNewAuthor = (c: FairnessCandidate): boolean => {
    const age = now - Date.parse(c.authorFirstSeenAt);
    return age >= 0 && age < C.newAuthorWindowDays * DAY_MS;
  };
  const singleSeller = pool.every(entry => entry.c.authorDid === pool[0]?.c.authorDid);
  const perAuthor = new Map<string, number>();
  const used = (a: string): number => perAuthor.get(a) ?? 0;
  const take = (a: string): void => { perAuthor.set(a, used(a) + 1); };
  // Reserved new-author slots: qualifying, non-promoted new authors with at least half of the page's top score.
  const slots = slotCount(pageSize);
  const slotItems: Entry[] = [];
  for (const e of pool) {
    if (slotItems.length >= slots) break;
    if (e.c.promoted || !isNewAuthor(e.c) || e.c.score < C.newAuthorMinScoreRatio * top || used(e.c.authorDid) >= C.maxPerAuthorPerPage) continue;
    slotItems.push(e); take(e.c.authorDid);
  }
  const chosen = new Set(slotItems);
  const regular: Entry[] = [];
  let promos = 0;
  let authorCapped = 0;
  let promotedDemoted = 0;
  for (const e of pool) {
    if (regular.length + slotItems.length >= pageSize) break;
    if (chosen.has(e)) continue;
    if (!singleSeller && used(e.c.authorDid) >= C.maxPerAuthorPerPage) {
      authorCapped++;
      continue;
    }
    if (e.c.promoted && promos >= cap) {
      promotedDemoted++;
      continue;
    }
    if (e.c.promoted) promos++;
    take(e.c.authorDid);
    regular.push(e);
  }

  const out = regular.map(e => ({ e, slot: false }));
  const positions = newAuthorSlotPositions(pageSize);
  for (const [i, e] of slotItems.entries()) {
    // All earlier reserved items precede this one in relevance order.
    const naturalPosition = i + regular.filter(r => r.index < e.index).length;
    out.splice(Math.min(positions[i] as number, naturalPosition), 0, { e, slot: true });
  }
  return {
    entries: out, onlySeller: singleSeller && out.length > C.maxPerAuthorPerPage,
    stats: { authorCapped, newAuthorSlotsFilled: slotItems.length, promotedDemoted },
  };
}

function explainFor(c: FairnessCandidate, shown: boolean, slot: boolean, onlySeller: boolean): ExplainEntry[] {
  const k = c.components; const out: ExplainEntry[] = [];
  if (k.text !== null && k.text > 0) out.push({ key: EXPLAIN_KEYS.textMatch, params: k.matchField ? { field: k.matchField } : {} });
  if (k.recency >= 0.5) out.push({ key: EXPLAIN_KEYS.recent, params: k.ageDays !== undefined ? { ageDays: Math.floor(k.ageDays) } : {} });
  if (k.distanceBucket) out.push({ key: EXPLAIN_KEYS.distanceBucket, params: { bucket: k.distanceBucket } });
  if (shown) out.push({ key: EXPLAIN_KEYS.promoted, params: {} });
  if (slot) out.push({ key: EXPLAIN_KEYS.newAuthorSlot, params: {} });
  if (onlySeller) out.push({ key: EXPLAIN_KEYS.onlySeller, params: {} });
  if (k.defaultRanking) out.push({ key: EXPLAIN_KEYS.defaultRanking, params: {} });
  return out;
}

/**
 * Re-ranks the top 200 scored candidates into pages and returns the page that starts at windowPosition (0 for the first page; then the
 * previous result's nextWindowPosition). The whole window is laid out deterministically on every call, so paging the same snapshot never
 * repeats or drops a result. Candidates beyond the 200 window are not part of the result.
 */
export function rerank(candidates: readonly unknown[], pageParams: PageParams, options: RerankOptions): Result<RerankResult, AppError> {
  if (!Array.isArray(candidates)) return err(invalid('candidates', 'INVALID_TYPE'));
  if (!options || typeof options.promotionEnabled !== 'boolean') return err(invalid('promotionEnabled', 'INVALID_TYPE'));
  if (!pageParams || typeof pageParams !== 'object' || Array.isArray(pageParams)) return err(invalid('pageParams', 'INVALID_TYPE'));
  if (!Number.isFinite(options.now)) return err(invalid('now', 'NOT_FINITE'));
  const pageSize = pageParams.pageSize ?? C.defaultPageSize;
  const position = pageParams.windowPosition ?? 0;
  if (!Number.isInteger(pageSize) || pageSize < C.minPageSize || pageSize > C.maxPageSize) return err(invalid('pageSize', 'OUT_OF_RANGE'));
  if (!Number.isInteger(position) || position < 0) return err(invalid('windowPosition', 'OUT_OF_RANGE'));
  const list: FairnessCandidate[] = [];
  const seen = new Set<string>();
  for (const [i, raw] of candidates.entries()) {
    const p = fairnessCandidateSchema.safeParse(raw);
    if (!p.success) return err(appError('VALIDATION_FAILED', { fields: p.error.issues.map(x => ({ path: [`candidates`, i, ...x.path].join('.'), code: x.code })) }));
    if (seen.has(p.data.documentId)) return err(invalid(`candidates.${i}.documentId`, 'DUPLICATE'));
    seen.add(p.data.documentId);
    list.push(p.data);
  }
  if (!options.promotionEnabled && list.some(c => c.promoted)) return err(fairnessErrors.make('FAIRNESS_PROMOTION_NOT_ALLOWED'));
  for (let i = 1; i < list.length; i++) if (!before(list[i - 1] as FairnessCandidate, list[i] as FairnessCandidate)) return err(fairnessErrors.make('FAIRNESS_INPUT_UNSORTED', { params: { index: i } }));
  const window = list.slice(0, C.windowSize);
  if (window.length === 0) return position === 0 ? ok({ items: [], nextWindowPosition: null, stats: { authorCapped: 0, newAuthorSlotsFilled: 0, promotedDemoted: 0 } }) : err(invalid('windowPosition', 'OUT_OF_WINDOW'));
  // Paid scores cannot be made organic by clearing their labels. The caller can rescore
  // with promotion disabled before requesting a page that has no promoted slots.
  if (promotedCap(pageSize) === 0 && window.some(c => c.promoted)) return err(invalid('pageSize', 'PROMOTED_QUOTA_ZERO'));
  let pool: Entry[] = window.map((c, index) => ({ c, index }));
  let start = 0;
  while (pool.length > 0) {
    const built = buildPage(pool, pageSize, options.now);
    if (start === position) {
      const items = built.entries.map(({ e, slot }) => {
        const onlySeller = built.onlySeller;
        return { documentId: e.c.documentId, authorDid: e.c.authorDid, score: e.c.score, promoted: e.c.promoted, newAuthorSlot: slot, onlySeller, explain: explainFor(e.c, e.c.promoted, slot, onlySeller) };
      });
      const used = new Set(built.entries.map(x => x.e));
      const next = start + built.entries.length;
      return ok({ items, nextWindowPosition: pool.length - used.size > 0 ? next : null, stats: built.stats });
    }
    const used = new Set(built.entries.map(x => x.e));
    start += built.entries.length;
    pool = pool.filter(e => !used.has(e));
  }
  return err(invalid('windowPosition', 'NOT_A_PAGE_START'));
}
