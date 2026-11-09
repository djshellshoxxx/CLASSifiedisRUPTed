import { appError, boundedString, canonicalJson, defineCommand, defineEvent, defineQuery, defineRepo, err, money, ok, timestamp, uuidv7, z, type CommandContext, type QueryContext, type SignedEnvelope, type StoredRecord } from '@classrup/kernel';
import { publicListingSchema, tombstoneSchema, type PublicListingProjection, type VerifiedStatement } from '@classrup/discovery';

const text = (min: number, max: number) => boundedString({ min, max }).refine(v => v === v.normalize('NFC') && !/[\p{Cc}\p{Cf}]/u.test(v));
const fields = {
  title: text(3, 120), description: boundedString({ max: 5000 }), categoryId: uuidv7(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'for_parts']).optional(),
  tags: z.array(text(2, 30)).max(10).default([]), locale: z.string().min(2).max(35).default('en'),
  regionCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(),
  barterOptIn: z.boolean().default(false), value: money({ sign: 'nonNegative' }).optional(),
  privateNotes: boundedString({ max: 2000 }).default(''),
};
export const listingSchema = z.strictObject({ ...fields, ownerId: z.string(), kind: z.enum(['sell', 'wanted', 'giveaway']),
  status: z.enum(['draft', 'published', 'unpublished', 'archived']), onHand: z.int().min(0).max(1),
  publicationCid: z.string().optional(), expiresAt: timestamp().optional(),
});
export type Listing = z.output<typeof listingSchema>;
export const listingRepo = defineRepo({ type: 'bazaar.listing', schema: listingSchema, indexes: { owner: d => d.ownerId, status: d => d.status } });
export const publicationRepo = defineRepo({ type: 'bazaar.publication', schema: z.strictObject({ envelope: z.custom<SignedEnvelope>(v => typeof v === 'object' && v !== null), listingId: z.string() }), indexes: { listing: d => d.listingId } });
const holdSchema = z.strictObject({ listingId: z.string(), ownerId: z.string(), subjectId: z.string(), revisionHash: z.string(), expiresAt: timestamp(), state: z.enum(['active', 'released']) });
export const inventoryHoldRepo = defineRepo({ type: 'bazaar.inventory_hold', schema: holdSchema, indexes: { listing: d => d.listingId, state: d => d.state, expiry: d => d.expiresAt, subject: d => d.subjectId } });
const holdChanged = defineEvent('bazaar.inventory.changed', 1, 'P2', z.strictObject({ listingId: z.string(), state: z.enum(['active', 'released']) }));
const changed = defineEvent('bazaar.listing.changed', 1, 'P3', z.strictObject({ listingId: z.string(), action: z.string() }));
export interface BazaarOptions {
  /** Resolve a category against an explicit local policy pack; there is deliberately no allow-all default. */
  readonly categoryAllowed: (categoryId: string) => boolean;
  readonly signProjection: (type: string, payload: unknown, revision: number, previousCid: string | null) => Promise<SignedEnvelope>;
  readonly verifyProjection: (envelope: unknown) => Promise<VerifiedStatement>;
}
function owned(ctx: CommandContext | QueryContext, id: string) {
  const record = ctx.tx.repo(listingRepo).get(id);
  return record && ctx.actor.kind === 'user' && record.data.ownerId === ctx.actor.id ? ok(record) : err(appError('NOT_FOUND'));
}
function emitChange(ctx: CommandContext, record: StoredRecord<Listing>, action: string) {
  ctx.emit(changed, { aggregate: { type: 'listing', id: record.id }, revision: record.revision, payload: { listingId: record.id, action } });
}
function held(ctx: CommandContext, listingId: string): boolean {
  const page = ctx.tx.repo(inventoryHoldRepo).query({ where: { listing: listingId, state: 'active', expiry: { gt: new Date(ctx.clock.now()).toISOString() } }, limit: 1 });
  if (!page.ok) throw new Error('invalid hold query');
  // A bounded query that cannot prove absence must fail closed.
  return page.value.nextCursor !== undefined || page.value.items.some(r => r.data.state === 'active' && Date.parse(r.data.expiresAt) > ctx.clock.now());
}
export function publicProjection(record: StoredRecord<Listing>, expiresAt: string, available: boolean): PublicListingProjection {
  const d = record.data;
  return publicListingSchema.parse({ listingId: record.id, ownerId: d.ownerId, revision: record.revision + 1,
    kind: d.kind, title: d.title, description: d.description, categoryId: d.categoryId,
    ...(d.condition ? { condition: d.condition } : {}), tags: d.tags, locale: d.locale, regionCell: d.regionCell,
    barterOptIn: d.barterOptIn, availability: available ? 'available' : 'unavailable', ...(d.value ? { value: d.value } : {}), expiresAt });
}
function nextSeq(ctx: CommandContext, previousCid: string | undefined): number {
  if (!previousCid) return 1;
  const previous = ctx.tx.repo(publicationRepo).get(previousCid);
  const seq = previous?.data.envelope['seq'];
  if (typeof seq !== 'number' || !Number.isSafeInteger(seq) || seq < 1) throw new Error('Missing publication chain evidence');
  return seq + 1;
}
export function bazaarDefinitions(options: BazaarOptions) {
  const create = defineCommand({ name: 'bazaar.listing.create', module: 'F01.S01.M01', capability: 'bazaar.listing.create', idempotent: true,
    input: z.strictObject({ ...fields, listingId: uuidv7(), kind: z.enum(['sell', 'wanted', 'giveaway']) }),
    handler(ctx, input) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      if (!options.categoryAllowed(input.categoryId)) return err(appError('PRECONDITION_FAILED'));
      if (input.kind !== 'wanted' && !input.condition) return err(appError('VALIDATION_FAILED'));
      const repo = ctx.tx.repo(listingRepo);
      const drafts = repo.query({ where: { owner: ctx.actor.id, status: 'draft' }, limit: 50 });
      if (!drafts.ok) return drafts;
      if (drafts.value.items.length >= 50) return err(appError('PRECONDITION_FAILED'));
      const { listingId, ...data } = input;
      const saved = repo.put(listingId, { ...data, ownerId: ctx.actor.id, status: 'draft', onHand: 1 }, { expectedRevision: 0 });
      if (!saved.ok) return saved;
      emitChange(ctx, saved.value, 'created');
      return ok(saved.value);
    },
  });
  const edit = defineCommand({ name: 'bazaar.listing.edit', module: 'F01.S01.M02', capability: 'bazaar.listing.edit', idempotent: true,
    input: z.strictObject({ ...fields, listingId: uuidv7(), expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      if (found.value.data.status !== 'draft' && found.value.data.status !== 'unpublished') return err(appError('CONFLICT_STATE'));
      if (!options.categoryAllowed(input.categoryId) || (found.value.data.kind !== 'wanted' && !input.condition)) return err(appError('PRECONDITION_FAILED'));
      const { listingId, expectedRevision, ...data } = input;
      const saved = ctx.tx.repo(listingRepo).put(listingId, { ...found.value.data, ...data }, { expectedRevision });
      if (!saved.ok) return saved; emitChange(ctx, saved.value, 'edited'); return ok(saved.value);
    },
  });
  const publish = defineCommand({ name: 'bazaar.listing.publish', module: 'F01.S01.M03', capability: 'bazaar.listing.publish', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1), expiryDays: z.int().min(1).max(90).default(30) }),
    async handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      const record = found.value;
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (record.data.status !== 'draft' && record.data.status !== 'unpublished') return err(appError('CONFLICT_STATE'));
      if (!options.categoryAllowed(record.data.categoryId)) return err(appError('PRECONDITION_FAILED'));
      const expiresAt = new Date(ctx.clock.now() + input.expiryDays * 86400000).toISOString();
      let projection: PublicListingProjection;
      try { projection = publicProjection(record, expiresAt, record.data.onHand === 1 && !held(ctx, record.id)); } catch { return err(appError('VALIDATION_FAILED')); }
      const signed = await sign('classrup.bazaar.listing/v1', projection, nextSeq(ctx, record.data.publicationCid), projection.ownerId, record.data.publicationCid ?? null);
      if (!signed.ok) return signed;
      const saved = ctx.tx.repo(listingRepo).put(record.id, { ...record.data, status: 'published', publicationCid: signed.value.cid, expiresAt }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      const publication = ctx.tx.repo(publicationRepo).put(signed.value.cid, { envelope: signed.value, listingId: record.id }, { expectedRevision: 0 });
      if (!publication.ok) return publication;
      emitChange(ctx, saved.value, 'published'); return ok({ listing: saved.value, envelope: signed.value, delivery: 'local-file-exchange' as const });
    },
  });
  async function sign(type: string, payload: unknown, revision: number, ownerId: string, prev: string | null) {
    try {
      const envelope = structuredClone(await options.signProjection(type, payload, revision, prev));
      const verified = await options.verifyProjection(envelope);
      if (verified.author !== ownerId || verified.type !== type || canonicalJson(verified.payload) !== canonicalJson(payload) || verified.cid !== envelope.cid) return err(appError('FORBIDDEN'));
      return ok(envelope);
    } catch { return err(appError('VALIDATION_FAILED')); }
  }
  const unpublish = defineCommand({ name: 'bazaar.listing.unpublish', module: 'F01.S01.M03', capability: 'bazaar.listing.publish', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1) }),
    async handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      const record = found.value;
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (record.data.status !== 'published' || held(ctx, record.id)) return err(appError('CONFLICT_STATE'));
      const payload = { target: record.data.publicationCid, reason: 'owner', listingId: record.id, ownerId: record.data.ownerId, revision: record.revision + 1 };
      const signed = await sign('classrup.alpha.tombstone/v1', payload, nextSeq(ctx, record.data.publicationCid), record.data.ownerId, record.data.publicationCid ?? null); if (!signed.ok) return signed;
      const { expiresAt: _expiresAt, ...data } = record.data;
      const saved = ctx.tx.repo(listingRepo).put(record.id, { ...data, status: 'unpublished', publicationCid: signed.value.cid }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      const pub = ctx.tx.repo(publicationRepo).put(signed.value.cid, { envelope: signed.value, listingId: record.id }, { expectedRevision: 0 });
      if (!pub.ok) return pub; emitChange(ctx, saved.value, 'unpublished'); return ok({ listing: saved.value, envelope: signed.value });
    },
  });
  const archive = defineCommand({ name: 'bazaar.listing.archive', module: 'F01.S01.M04', capability: 'bazaar.listing.archive', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      if (found.value.data.status !== 'unpublished' || held(ctx, input.listingId)) return err(appError('CONFLICT_STATE'));
      const saved = ctx.tx.repo(listingRepo).put(input.listingId, { ...found.value.data, status: 'archived' }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved; emitChange(ctx, saved.value, 'archived'); return ok(saved.value);
    },
  });
  const get = defineQuery({ name: 'bazaar.listing.get', module: 'F01.S01.M01', capability: 'bazaar.listing.read', input: z.strictObject({ listingId: uuidv7() }), handler: (ctx, input) => owned(ctx, input.listingId) });
  const list = defineQuery({ name: 'bazaar.listing.list', module: 'F01.S01.M01', capability: 'bazaar.listing.read', input: z.strictObject({ cursor: z.string().max(500).optional() }),
    handler(ctx, input) { if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN')); return ctx.tx.repo(listingRepo).query({ where: { owner: ctx.actor.id }, limit: 50, ...input }); },
  });
  const reserve = defineCommand({ name: 'bazaar.inventory.reserve', module: 'F01.S03.M01', capability: 'bazaar.inventory.reserve', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1), holdId: uuidv7(), subjectId: uuidv7(), revisionHash: z.string().min(16).max(200), expiresAt: timestamp() }),
    async handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      const r = found.value;
      if (r.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const expiry = Date.parse(input.expiresAt);
      if (r.data.status !== 'published' || !r.data.barterOptIn || r.data.onHand !== 1 || expiry <= ctx.clock.now() || expiry > ctx.clock.now() + 30 * 86400000 || expiry > Date.parse(r.data.expiresAt ?? '') || held(ctx, r.id)) return err(appError('CONFLICT_STATE'));
      const payload = { subjectId: input.subjectId, revisionHash: input.revisionHash, giverId: r.data.ownerId, itemId: r.id, expiresAt: input.expiresAt, holdId: input.holdId };
      const signed = await sign('classrup.alpha.reservation/v1', payload, 1, r.data.ownerId, null);
      if (!signed.ok) return signed;
      const saved = ctx.tx.repo(inventoryHoldRepo).put(input.holdId, { listingId: r.id, ownerId: r.data.ownerId, subjectId: input.subjectId, revisionHash: input.revisionHash, expiresAt: input.expiresAt, state: 'active' }, { expectedRevision: 0 });
      if (!saved.ok) return saved;
      const pub = ctx.tx.repo(publicationRepo).put(signed.value.cid, { envelope: signed.value, listingId: r.id }, { expectedRevision: 0 });
      if (!pub.ok) return pub;
      ctx.emit(holdChanged, { aggregate: { type: 'inventory_hold', id: input.holdId }, revision: saved.value.revision, payload: { listingId: r.id, state: 'active' } }); return ok({ hold: saved.value, envelope: signed.value });
    },
  });
  const release = defineCommand({ name: 'bazaar.inventory.release', module: 'F01.S03.M01', capability: 'bazaar.inventory.reserve', idempotent: true,
    input: z.strictObject({ holdId: uuidv7(), expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const repo = ctx.tx.repo(inventoryHoldRepo); const hold = repo.get(input.holdId);
      if (!hold || ctx.actor.kind !== 'user' || hold.data.ownerId !== ctx.actor.id) return err(appError('NOT_FOUND'));
      if (hold.data.state !== 'active') return err(appError('CONFLICT_STATE'));
      const saved = repo.put(input.holdId, { ...hold.data, state: 'released' }, { expectedRevision: input.expectedRevision });
      if (!saved.ok) return saved;
      ctx.emit(holdChanged, { aggregate: { type: 'inventory_hold', id: input.holdId }, revision: saved.value.revision, payload: { listingId: hold.data.listingId, state: 'released' } });
      return saved;
    },
  });
  return { create, edit, publish, unpublish, archive, get, list, reserve, release, all: [create, edit, publish, unpublish, archive, get, list, reserve, release] as const };
}

/** Local single-item promise only; never implies a remote/global inventory lock. */
export function ownReservationExists(ctx: CommandContext, subjectId: string, revisionHash: string, itemId: string, requiredExpiry: number): boolean {
  if (ctx.actor.kind !== 'user') return false;
  const principal = ctx.actor.id;
  const page = ctx.tx.repo(inventoryHoldRepo).query({ where: { listing: itemId, state: 'active', expiry: { gt: new Date(ctx.clock.now()).toISOString() } }, limit: 500 });
  return page.ok && page.value.items.some(r => r.data.ownerId === principal && r.data.subjectId === subjectId
    && r.data.revisionHash === revisionHash && r.data.state === 'active' && Date.parse(r.data.expiresAt) >= requiredExpiry && Date.parse(r.data.expiresAt) > ctx.clock.now());
}
/** Validate signed publication records before rebuilding an export/import cache. */
export async function validatePublicationRecord(input: unknown, verify: BazaarOptions['verifyProjection']): Promise<void> {
  const data = publicationRepo.schema.parse(input);
  const envelope = await verify(data.envelope);
  if (envelope.type === 'classrup.bazaar.listing/v1') {
    const p = publicListingSchema.parse(envelope.payload);
    if (p.ownerId !== envelope.author || p.listingId !== data.listingId) throw new Error('Publication author or subject mismatch');
  } else if (envelope.type === 'classrup.alpha.tombstone/v1') {
    const p = tombstoneSchema.parse(envelope.payload);
    if (p.ownerId !== envelope.author || p.listingId !== data.listingId) throw new Error('Tombstone author or subject mismatch');
  } else if (envelope.type === 'classrup.alpha.reservation/v1') {
    const p = z.strictObject({ subjectId: uuidv7(), revisionHash: z.string().min(16).max(200), giverId: z.string(), itemId: uuidv7(), expiresAt: timestamp(), holdId: uuidv7() }).parse(envelope.payload);
    if (p.giverId !== envelope.author || p.itemId !== data.listingId) throw new Error('Reservation author or subject mismatch');
  } else throw new Error('Unsupported publication type');
}

/** Called inside the coordinator's transaction on explicit cancel/expiry/recovery. */
export function releaseSubjectReservations(ctx: CommandContext, subjectId: string) {
  if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
  const principal = ctx.actor.id;
  const repo = ctx.tx.repo(inventoryHoldRepo);
  const page = repo.query({ where: { subject: subjectId, state: 'active' }, limit: 500 });
  if (!page.ok) return page;
  if (page.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
  let released = 0;
  for (const hold of page.value.items) {
    if (hold.data.ownerId !== principal) return err(appError('FORBIDDEN'));
    const saved = repo.put(hold.id, { ...hold.data, state: 'released' }, { expectedRevision: hold.revision });
    if (!saved.ok) return saved;
    ctx.emit(holdChanged, { aggregate: { type: 'inventory_hold', id: hold.id }, revision: saved.value.revision, payload: { listingId: hold.data.listingId, state: 'released' } });
    released++;
  }
  return ok(released);
}
