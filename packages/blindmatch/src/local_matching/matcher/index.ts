import { appError, err, ok, timestamp, uuidv7, z, type AppError, type Result } from '@classrup/kernel';
import { publicListingSchema, type RetainedListing } from '@classrup/discovery';
import { privateIntentCriteriaSchema } from '../../intents/local/index.ts';

export const MAX_LOCAL_MATCH_CANDIDATES = 128;
const owner = z.string().min(9).max(128).startsWith('did:key:');
const cid = z.string().min(1).max(200);
const metadataSchema = z.strictObject({
  ownerId: owner, listingId: uuidv7(), remoteRevision: z.int().positive(), cid,
  envelopes: z.array(z.unknown()).min(1).max(2), projection: z.unknown(),
  observedAt: timestamp(), conflicted: z.boolean(), evidenceCids: z.array(cid).min(1).max(2),
});
const optionsSchema = z.strictObject({
  ownerId: owner, now: z.int().nonnegative().max(8_640_000_000_000_000),
  blockedOwners: z.array(owner).max(2000).optional(),
  signal: z.custom<AbortSignal>(v => v instanceof AbortSignal).optional(),
});

export interface LocalMatchSuggestion {
  readonly ownerId: string;
  readonly listingId: string;
  readonly revision: number;
  readonly cid: string;
}

const invalid = () => err(appError('VALIDATION_FAILED'));
const cancelled = () => err(appError('PRECONDITION_FAILED'));

function dataObject(value: unknown, maxKeys: number): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length <= maxKeys && keys.every(k => typeof k === 'string' && 'value' in Object.getOwnPropertyDescriptor(value, k)!);
}

function dataArray(value: unknown, min: number, max: number): value is unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return false;
  if (Reflect.ownKeys(value).length !== value.length + 1) return false;
  for (let i = 0; i < value.length; i++) if (!Object.getOwnPropertyDescriptor(value, i)?.hasOwnProperty('value')) return false;
  return true;
}

/** Cheap UTF-16 ceilings precede discovery's code-point validation. Opaque envelopes are never traversed. */
function boundedProjection(value: unknown): boolean {
  if (!dataObject(value, 15)) return false;
  const p = value;
  return typeof p.title === 'string' && p.title.length <= 240
    && typeof p.description === 'string' && p.description.length <= 10000
    && dataArray(p.tags, 0, 10) && p.tags.every(t => typeof t === 'string' && t.length <= 60)
    && (p.value === undefined || dataObject(p.value, 2));
}

function compareCodePoints(a: string, b: string): number {
  const left = Array.from(a, c => c.codePointAt(0)!);
  const right = Array.from(b, c => c.codePointAt(0)!);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const delta = left[i]! - right[i]!;
    if (delta !== 0) return delta;
  }
  return left.length - right.length;
}

/**
 * Pure local matching over a bounded snapshot already verified by the discovery adapter.
 * Structural revalidation cannot establish signatures or global freshness. This function
 * authorizes no disclosure, hold, contact or trade, and makes no confidential-computation claim.
 */
export function matchLocalCandidates(criteria: unknown, candidates: readonly unknown[], options: {
  readonly ownerId: string; readonly now: number; readonly blockedOwners?: readonly string[]; readonly signal?: AbortSignal;
}): Result<readonly LocalMatchSuggestion[], AppError> {
  try {
    if (!Array.isArray(candidates)) return invalid();
    if (candidates.length > MAX_LOCAL_MATCH_CANDIDATES) return err(appError('PAYLOAD_TOO_LARGE'));
    if (!dataArray(candidates, 0, MAX_LOCAL_MATCH_CANDIDATES) || !dataObject(options, 4)
      || (options.blockedOwners !== undefined && !dataArray(options.blockedOwners, 0, 2000))) return invalid();
    if (!dataObject(criteria, 6) || (criteria.query !== undefined && (typeof criteria.query !== 'string' || criteria.query.length > 120))
      || (criteria.price !== undefined && !dataObject(criteria.price, 3))) return invalid();
    const parsedOptions = optionsSchema.safeParse(options);
    const parsedCriteria = privateIntentCriteriaSchema.safeParse(criteria);
    if (!parsedOptions.success || !parsedCriteria.success) return invalid();
    const o = parsedOptions.data, c = parsedCriteria.data;
    if (o.signal?.aborted) return cancelled();
    const blocked = new Set(o.blockedOwners ?? []);
    const seen = new Set<string>();
    const suggestions: LocalMatchSuggestion[] = [];
    const query = c.query.toLowerCase();
    const count = candidates.length;
    for (let i = 0; i < count; i++) {
      if (o.signal?.aborted) return cancelled();
      const candidate = candidates[i];
      if (!dataObject(candidate, 9) || !dataArray(candidate.envelopes, 1, 2) || !dataArray(candidate.evidenceCids, 1, 2)) return invalid();
      const parsed = metadataSchema.safeParse(candidate);
      if (!parsed.success) return invalid();
      const r = parsed.data;
      if (r.evidenceCids.length !== r.envelopes.length || r.evidenceCids[0] !== r.cid
        || r.conflicted !== (r.evidenceCids.length === 2 && r.evidenceCids[0] !== r.evidenceCids[1])) return invalid();
      const key = JSON.stringify([r.ownerId, r.listingId]);
      if (seen.has(key)) return err(appError('CONFLICT_REVISION'));
      seen.add(key);
      let projection: RetainedListing['projection'] = null;
      if (r.projection !== null) {
        if (!boundedProjection(r.projection)) return invalid();
        const checked = publicListingSchema.safeParse(r.projection);
        if (!checked.success) return invalid();
        projection = checked.data;
        if (projection.ownerId !== r.ownerId || projection.listingId !== r.listingId || projection.revision !== r.remoteRevision) return invalid();
      }
      const p = projection;
      if (!p || r.conflicted || r.ownerId === o.ownerId || blocked.has(r.ownerId)
        || p.availability !== 'available' || Date.parse(p.expiresAt) <= o.now) continue;
      if ((c.categoryId && p.categoryId !== c.categoryId) || (c.kind && p.kind !== c.kind)
        || (c.condition && p.condition !== c.condition) || (c.regionCell && !p.regionCell.startsWith(c.regionCell))) continue;
      if (c.price && (!p.value || p.value.currency !== c.price.currency
        || (c.price.min !== undefined && BigInt(p.value.amount) < BigInt(c.price.min))
        || (c.price.max !== undefined && BigInt(p.value.amount) > BigInt(c.price.max)))) continue;
      if (query && !`${p.title} ${p.description} ${p.tags.join(' ')}`.normalize('NFC').toLowerCase().includes(query)) continue;
      suggestions.push({ ownerId: r.ownerId, listingId: r.listingId, revision: r.remoteRevision, cid: r.cid });
    }
    if (o.signal?.aborted) return cancelled();
    return ok(suggestions.sort((a, b) => compareCodePoints(a.ownerId, b.ownerId) || compareCodePoints(a.listingId, b.listingId)));
  } catch { return invalid(); }
}
