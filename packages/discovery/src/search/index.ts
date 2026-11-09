import { appError, boundedString, canonicalJson, defineCommand, defineEvent, defineQuery, defineRepo, err, money, ok, timestamp, uuidv7, z, type ReadRepo, type SignedEnvelope } from '@classrup/kernel';

const cleanText = (min: number, max: number) => boundedString({ min, max }).refine(v => v === v.normalize('NFC') && !/[\p{Cc}\p{Cf}]/u.test(v));
export const publicListingSchema = z.strictObject({
  listingId: uuidv7(), ownerId: z.string().startsWith('did:key:').max(128), revision: z.int().min(1),
  kind: z.enum(['sell', 'wanted', 'giveaway']), title: cleanText(3, 120), description: boundedString({ min: 10, max: 5000 }),
  categoryId: uuidv7(), condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'for_parts']).optional(),
  tags: z.array(cleanText(2, 30)).max(10), locale: z.string().min(2).max(35),
  regionCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/), barterOptIn: z.boolean(),
  availability: z.enum(['available', 'unavailable']), value: money({ sign: 'nonNegative' }).optional(), expiresAt: timestamp(),
}).refine(v => v.kind === 'wanted' || v.condition !== undefined)
  .refine(v => v.kind !== 'sell' || v.value !== undefined);
export type PublicListingProjection = z.output<typeof publicListingSchema>;
export const tombstoneSchema = z.strictObject({ listingId: uuidv7(), ownerId: z.string().startsWith('did:key:').max(128), revision: z.int().min(1), target: z.string().min(1).max(200), reason: z.enum(['owner', 'policy_changed', 'closed', 'archived', 'account_deleted']) });
export interface VerifiedStatement { readonly author: string; readonly type: string; readonly payload: unknown; readonly cid: string; readonly seq: number; }
export interface DiscoveryOptions { readonly verifyEnvelope: (input: unknown) => Promise<VerifiedStatement>; }
const retainedSchema = z.strictObject({
  ownerId: z.string(), listingId: z.string(), remoteRevision: z.int().positive(), cid: z.string(),
  envelopes: z.array(z.unknown()).min(1).max(2), projection: publicListingSchema.nullable(), observedAt: timestamp(), conflicted: z.boolean(), evidenceCids: z.array(z.string()).max(2),
});
export type RetainedListing = z.output<typeof retainedSchema>;
export const retainedListingRepo = defineRepo({ type: 'discovery.retained_listing', schema: retainedSchema, indexes: { owner: d => d.ownerId } });
const retained = defineEvent('discovery.listing.retained', 1, 'P2', z.strictObject({ listingId: z.string(), conflicted: z.boolean() }));
export const MAX_RETAINED_LISTINGS = 2000;
function allRetained(repo: ReadRepo<RetainedListing, 'owner'>): RetainedListing[] {
  const items: RetainedListing[] = [];
  let cursor: string | undefined;
  do {
    const page = repo.query({ limit: 500, ...(cursor ? { cursor } : {}) });
    if (!page.ok) throw new Error('invalid retained listing query');
    items.push(...page.value.items.map(r => r.data));
    cursor = page.value.nextCursor;
  } while (cursor && items.length <= MAX_RETAINED_LISTINGS);
  return items;
}
/** Verification is mandatory and happens before the transaction mutates any retained record. */
export function discoveryDefinitions(options: DiscoveryOptions) {
  const retain = defineCommand({
    name: 'discovery.listing.retain', module: 'F06.S01.M01', capability: 'discovery.listing.retain', idempotent: true,
    input: z.strictObject({ envelope: z.unknown() }),
    async handler(ctx, input) {
      let envelope: VerifiedStatement;
      let snapshot: unknown;
      try { snapshot = structuredClone(input.envelope); envelope = await options.verifyEnvelope(snapshot); } catch { return err(appError('VALIDATION_FAILED')); }
      const isTombstone = envelope.type === 'classrup.alpha.tombstone/v1';
      if (!isTombstone && envelope.type !== 'classrup.bazaar.listing/v1') return err(appError('VALIDATION_FAILED'));
      const repo = ctx.tx.repo(retainedListingRepo);
      let data: { ownerId: string; listingId: string; revision: number };
      let projection: PublicListingProjection | null;
      if (isTombstone) {
        const parsed = tombstoneSchema.safeParse(envelope.payload);
        if (!parsed.success) return err(appError('VALIDATION_FAILED'));
        if (parsed.data.ownerId !== envelope.author) return err(appError('FORBIDDEN'));
        data = parsed.data;
        projection = null;
      } else {
        const parsed = publicListingSchema.safeParse(envelope.payload);
        if (!parsed.success || parsed.data.ownerId !== envelope.author) return err(appError('FORBIDDEN'));
        data = parsed.data;
        projection = parsed.data;
      }
      if (projection && Date.parse(projection.expiresAt) <= ctx.clock.now()) return err(appError('PRECONDITION_FAILED'));
      const key = `${data.ownerId}/${data.listingId}`;
      const previous = repo.get(key);
      if (isTombstone && previous && previous.data.cid !== envelope.cid && tombstoneSchema.parse(envelope.payload).target !== previous.data.cid) return err(appError('CONFLICT_REVISION'));
      if (previous?.data.cid === envelope.cid) return ok({ state: previous.data.conflicted ? 'conflicted' : 'retained', cid: envelope.cid });
      if (previous && (previous.data.conflicted || data.revision < previous.data.remoteRevision)) return err(appError('CONFLICT_REVISION'));
      const conflicted = previous !== undefined && data.revision === previous.data.remoteRevision;
      if (!previous && allRetained(repo).length >= MAX_RETAINED_LISTINGS) return err(appError('PRECONDITION_FAILED'));
      const next: RetainedListing = conflicted ? {
        ...previous.data, conflicted: true, evidenceCids: [previous.data.cid, envelope.cid], envelopes: [...previous.data.envelopes.slice(0, 1), snapshot],
      } : {
        ownerId: data.ownerId, listingId: data.listingId, remoteRevision: data.revision, cid: envelope.cid, projection,
        observedAt: new Date(ctx.clock.now()).toISOString(), conflicted: false, evidenceCids: [envelope.cid], envelopes: [snapshot],
      };
      const put = repo.put(key, next, { expectedRevision: previous?.revision ?? 0 });
      if (!put.ok) return put;
      ctx.emit(retained, { aggregate: { type: 'listing', id: data.listingId }, revision: put.value.revision, payload: { listingId: data.listingId, conflicted } });
      return ok({ state: conflicted ? 'conflicted' : 'retained', cid: envelope.cid });
    },
  });
  const search = defineQuery({
    name: 'discovery.listing.search', module: 'F06.S01.M02', capability: 'discovery.listing.search',
    input: z.strictObject({ query: z.string().max(120).default(''), regionCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(),
      barterOnly: z.boolean().default(false), blockedOwners: z.array(z.string().max(128)).max(2000).default([]), includeUnavailable: z.boolean().default(false) }),
    handler(ctx, input) {
      const blocked = new Set(input.blockedOwners);
      const query = input.query.normalize('NFC').toLowerCase();
      const records = allRetained(ctx.tx.repo(retainedListingRepo));
      const items = records.filter(r => {
        const p = r.projection;
        return p && !r.conflicted && !blocked.has(r.ownerId) && Date.parse(p.expiresAt) > ctx.clock.now()
          && (!input.barterOnly || p.barterOptIn) && (input.includeUnavailable || p.availability === 'available')
          && (!input.regionCell || p.regionCell.startsWith(input.regionCell))
          && `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(query);
      });
      return ok({ items, source: 'locally-retained' as const, staleOrExcluded: records.length - items.length });
    },
  });
  return { retain, search, all: [retain, search] as const };
}
// Signature storage uses the kernel's opaque envelope representation; no trust is inferred from this type.
export type ListingStatement = SignedEnvelope;

/** Rebuild trust from signed evidence before accepting an encrypted backup's retained cache. */
export async function validateRetainedRecord(input: unknown, verify: DiscoveryOptions['verifyEnvelope']): Promise<void> {
  const data = retainedSchema.parse(input);
  const evidence = await Promise.all(data.envelopes.map(e => verify(e)));
  if (evidence.length !== data.evidenceCids.length || evidence.some((e, i) => e.cid !== data.evidenceCids[i] || e.author !== data.ownerId)) throw new Error('Invalid retained provenance');
  const first = evidence[0];
  if (!first || first.cid !== data.cid) throw new Error('Invalid retained CID');
  const payloads = evidence.map(e => {
    if (e.type === 'classrup.bazaar.listing/v1') return publicListingSchema.parse(e.payload);
    if (e.type === 'classrup.alpha.tombstone/v1') return tombstoneSchema.parse(e.payload);
    throw new Error('Unsupported retained statement');
  });
  if (payloads.some(p => p.ownerId !== data.ownerId || p.listingId !== data.listingId || p.revision !== data.remoteRevision)) throw new Error('Invalid retained subject or revision');
  if (data.conflicted !== (evidence.length === 2 && evidence[0]?.cid !== evidence[1]?.cid)) throw new Error('Invalid conflict evidence');
  const projection = first.type === 'classrup.bazaar.listing/v1' ? payloads[0] : null;
  if (canonicalJson(projection) !== canonicalJson(data.projection)) throw new Error('Retained projection differs from signed evidence');
}
