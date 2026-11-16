import { appError, canonicalJson, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, sha256Hex, timestamp, uuidv7, z, type CommandContext, type QueryContext, type StoredRecord } from '@classrup/kernel';
import { listingRepo, listingSchema, type Listing } from './model.ts';

export const publicEditFields = ['title', 'description', 'categoryId', 'condition', 'tags', 'locale', 'regionCell', 'barterOptIn', 'value'] as const;
const fieldSchema = z.enum(publicEditFields);
const materialFields = new Set<string>(['categoryId', 'condition', 'value']);
const snapshotSchema = listingSchema.omit({ privateNotes: true, status: true, onHand: true, publicationCid: true, expiresAt: true });
export const listingRevisionSchema = z.strictObject({
  listingId: uuidv7(), revisionNo: z.int().min(1), ownerId: z.string(), editorId: z.string(),
  source: z.enum(['system', 'owner_edit']), changedFields: z.array(fieldSchema).max(20),
  material: z.boolean(), snapshot: snapshotSchema, snapshotHash: z.string().regex(/^sha256-[a-f0-9]{64}$/),
  wasPublic: z.boolean(), createdAt: timestamp(),
}).superRefine((data, ctx) => {
  if (data.ownerId !== data.editorId || data.ownerId !== data.snapshot.ownerId) ctx.addIssue({ code: 'custom', message: 'Revision owner mismatch' });
  if (new Set(data.changedFields).size !== data.changedFields.length) ctx.addIssue({ code: 'custom', message: 'Duplicate changed fields' });
  if (data.material !== data.changedFields.some(field => materialFields.has(field))) ctx.addIssue({ code: 'custom', message: 'Invalid material marker' });
});
export type ListingRevision = z.output<typeof listingRevisionSchema>;
export const listingRevisionRepo = defineRepo({ type: 'bazaar.listing_revision', schema: listingRevisionSchema,
  indexes: { listing: data => data.listingId, number: data => String(data.revisionNo).padStart(16, '0') } });
const revisionErrors = defineErrors({ BAZAAR_EDIT_REVISION_LIMIT: { status: 409, retryable: false } });
const edited = defineEvent('bazaar.listing.edited', 1, 'P1', z.strictObject({ listingId: uuidv7(), ownerId: z.string(), revision: z.int(), status: listingSchema.shape.status, material: z.boolean(), changedFields: z.array(fieldSchema), source: z.literal('owner_edit') }));

export function changedPublicFields(before: Listing, after: Listing): Array<typeof publicEditFields[number]> {
  return publicEditFields.filter(field => canonicalJson(before[field]) !== canonicalJson(after[field]));
}
function snapshot(data: Listing) {
  const { privateNotes: _notes, status: _status, onHand: _onHand, publicationCid: _cid, expiresAt: _expiry, ...publicData } = data;
  return snapshotSchema.parse(publicData);
}
/** Stable alpha storage key makes (listing, revision) unique and prevents accidental overwrite. */
export const listingRevisionId = (listingId: string, revision: number): string => `${listingId}:${String(revision).padStart(16, '0')}`;

export async function recordListingRevision(ctx: CommandContext, record: StoredRecord<Listing>, source: ListingRevision['source'], changedFields: ListingRevision['changedFields']) {
  if (ctx.actor.kind !== 'user' || ctx.actor.id !== record.data.ownerId) return err(appError('FORBIDDEN'));
  const repo = ctx.tx.repo(listingRevisionRepo);
  const existing = repo.query({ where: { listing: record.id }, limit: 100 });
  if (!existing.ok) return existing;
  if (existing.value.items.length >= 100 || existing.value.nextCursor) return err(revisionErrors.make('BAZAAR_EDIT_REVISION_LIMIT'));
  if (source === 'owner_edit' && existing.value.items.filter(row => row.data.source === 'owner_edit' && Date.parse(row.data.createdAt) > ctx.clock.now() - 3600000).length >= 20) return err(appError('RATE_LIMITED', { retryAfterMs: 3600000 }));
  const listingId = uuidv7().parse(record.id);
  const publicData = snapshot(record.data);
  const material = changedFields.some(field => materialFields.has(field));
  const saved = repo.put(listingRevisionId(record.id, record.revision), { listingId, revisionNo: record.revision,
    ownerId: record.data.ownerId, editorId: ctx.actor.id, source, changedFields, material, snapshot: publicData,
    snapshotHash: `sha256-${await sha256Hex(canonicalJson(publicData))}`, wasPublic: record.data.status === 'published', createdAt: ctx.clock.iso() }, { expectedRevision: 0 });
  if (!saved.ok) return saved;
  if (source === 'owner_edit') ctx.emit(edited, { aggregate: { type: 'listing', id: record.id }, revision: record.revision,
    payload: { listingId, ownerId: record.data.ownerId, revision: record.revision, status: record.data.status, material, changedFields, source } });
  return ok(saved.value);
}
export async function validateListingRevision(input: unknown): Promise<void> {
  const row = listingRevisionSchema.parse(input);
  if (row.snapshotHash !== `sha256-${await sha256Hex(canonicalJson(row.snapshot))}`) throw new Error('Listing revision snapshot hash mismatch');
}

async function verifyStored(record: StoredRecord<ListingRevision>, listingId: string, ownerId: string): Promise<void> {
  if (record.id !== listingRevisionId(record.data.listingId, record.data.revisionNo) || record.data.listingId !== listingId || record.data.ownerId !== ownerId) throw new Error('Listing revision key or owner mismatch');
  await validateListingRevision(record.data);
}

export function listingHistoryDefinitions() {
  function owner(ctx: QueryContext, listingId: string): boolean {
    const listing = ctx.tx.repo(listingRepo).get(listingId);
    return !!listing && ctx.actor.kind === 'user' && listing.data.ownerId === ctx.actor.id;
  }
  const list = defineQuery({ name: 'bazaar.listing_revision.list', module: 'F01.S01.M02', capability: 'bazaar.listing_revision.read',
    input: z.strictObject({ listingId: uuidv7(), cursor: z.string().max(2000).optional(), limit: z.int().min(1).max(50).default(50) }),
    async handler(ctx, input) {
      if (!owner(ctx, input.listingId)) return err(appError('NOT_FOUND'));
      const page = ctx.tx.repo(listingRevisionRepo).query({ where: { listing: input.listingId }, orderBy: 'number', dir: 'desc', limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      if (!page.ok) return page;
      try { for (const row of page.value.items) await verifyStored(row, input.listingId, ctx.actor.kind === 'user' ? ctx.actor.id : ''); }
      catch { return err(appError('VALIDATION_FAILED')); }
      return page;
    } });
  const get = defineQuery({ name: 'bazaar.listing_revision.get', module: 'F01.S01.M02', capability: 'bazaar.listing_revision.read',
    input: z.strictObject({ listingId: uuidv7(), revisionNo: z.int().min(1) }),
    async handler(ctx, input) {
      if (!owner(ctx, input.listingId)) return err(appError('NOT_FOUND'));
      const revision = ctx.tx.repo(listingRevisionRepo).get(listingRevisionId(input.listingId, input.revisionNo));
      if (!revision) return err(appError('NOT_FOUND'));
      try { await verifyStored(revision, input.listingId, ctx.actor.kind === 'user' ? ctx.actor.id : ''); }
      catch { return err(appError('VALIDATION_FAILED')); }
      return ok({ revision });
    } });
  return { list, get, all: [list, get] as const };
}
