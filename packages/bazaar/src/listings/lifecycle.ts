import { appError, defineCommand, defineEvent, err, ok, timestamp, uuidv7, z, type AppError, type CommandContext, type Result, type SignedEnvelope, type StoredRecord } from '@classrup/kernel';
import { activeArchiveRecord, archiveErrors, archiveRecordRepo, AUTO_ARCHIVE_AFTER_MS, closeReasonSchema, closeReferenceSchema, recordArchive } from './archive.ts';
import { inventoryHoldRepo, listingRepo, publicationRepo, type Listing } from './model.ts';

interface LifecycleOptions {
  readonly endPublication: (ctx: CommandContext, listing: StoredRecord<Listing>, reason: 'closed' | 'archived') => Promise<Result<SignedEnvelope, AppError>>;
  readonly emitChange: (ctx: CommandContext, listing: StoredRecord<Listing>, action: string) => void;
}
const expired = defineEvent('bazaar.listing.expired', 1, 'P0', z.strictObject({ listingId: uuidv7(), ownerId: z.string(), expiredAt: timestamp() }));
// The optional deal/trade reference stays in owner-only evidence, never in this public event.
const closed = defineEvent('bazaar.listing.closed', 1, 'P0', z.strictObject({ listingId: uuidv7(), ownerId: z.string(), closeReason: closeReasonSchema }));
const holdChanged = defineEvent('bazaar.inventory.changed', 1, 'P2', z.strictObject({ listingId: z.string(), state: z.enum(['active', 'released']) }));

function owned(ctx: CommandContext, listingId: string) {
  const record = ctx.tx.repo(listingRepo).get(listingId);
  return record && ctx.actor.kind === 'user' && record.data.ownerId === ctx.actor.id ? ok(record) : err(appError('NOT_FOUND'));
}

/** Release only after explicit owner confirmation; expiry and scheduled archive never release live holds. */
function checkHolds(ctx: CommandContext, listing: StoredRecord<Listing>, release: boolean, observedAt: number): Result<void, AppError> {
  const repo = ctx.tx.repo(inventoryHoldRepo);
  const page = repo.query({ where: { listing: listing.id, state: 'active', expiry: { gt: new Date(observedAt).toISOString() } }, limit: 500 });
  if (!page.ok) return page;
  if (page.value.nextCursor) return err(appError('PRECONDITION_FAILED'));
  if (page.value.items.length && !release) return err(archiveErrors.make('BAZAAR_ARCHIVE_HOLD_ACTIVE'));
  for (const hold of page.value.items) {
    if (hold.data.ownerId !== listing.data.ownerId) return err(appError('FORBIDDEN'));
    const saved = repo.put(hold.id, { ...hold.data, state: 'released' }, { expectedRevision: hold.revision });
    if (!saved.ok) return saved;
    ctx.emit(holdChanged, { aggregate: { type: 'inventory_hold', id: hold.id }, revision: saved.value.revision,
      payload: { listingId: listing.id, state: 'released' } });
  }
  return ok(undefined);
}

export function listingLifecycleDefinitions(options: LifecycleOptions) {
  async function endPublication(ctx: CommandContext, record: StoredRecord<Listing>, reason: 'closed' | 'archived'): Promise<Result<SignedEnvelope | undefined, AppError>> {
    if (record.data.status !== 'published') return ok(undefined);
    const signed = await options.endPublication(ctx, record, reason);
    if (!signed.ok) return signed;
    const saved = ctx.tx.repo(publicationRepo).put(signed.value.cid, { envelope: signed.value, listingId: record.id }, { expectedRevision: 0 });
    return saved.ok ? signed : saved;
  }

  async function archiveOne(ctx: CommandContext, record: StoredRecord<Listing>, releaseHolds: boolean, observedAt: number) {
    if (record.data.status === 'archived') return err(appError('CONFLICT_STATE'));
    const holds = checkHolds(ctx, record, releaseHolds, observedAt); if (!holds.ok) return holds;
    const signed = await endPublication(ctx, record, 'archived'); if (!signed.ok) return signed;
    const { expiresAt: _expiry, ...data } = record.data;
    const saved = ctx.tx.repo(listingRepo).put(record.id, { ...data, status: 'archived', ...(signed.value ? { publicationCid: signed.value.cid } : {}) }, { expectedRevision: record.revision });
    if (!saved.ok) return saved;
    const evidence = recordArchive(ctx, saved.value, observedAt); if (!evidence.ok) return evidence;
    options.emitChange(ctx, saved.value, 'archived');
    return ok({ ...evidence.value, ...(signed.value ? { envelope: signed.value } : {}) });
  }

  async function expireOne(ctx: CommandContext, record: StoredRecord<Listing>, observedAt: number): Promise<Result<{ archiveRecordId: string; expiredAt: string; envelope?: SignedEnvelope }, AppError>> {
    const prior = activeArchiveRecord(ctx, record.id); if (!prior.ok) return prior;
    if (prior.value && prior.value.data.ownerId !== record.data.ownerId) return err(appError('FORBIDDEN'));
    if (record.data.status === 'expired' && prior.value?.data.status === 'expired') {
      return ok({ archiveRecordId: prior.value.id, expiredAt: prior.value.data.endedAt });
    }
    if (record.data.status !== 'published' || !record.data.expiresAt || Date.parse(record.data.expiresAt) > observedAt || prior.value) return err(appError('CONFLICT_STATE'));
    const holds = checkHolds(ctx, record, false, observedAt); if (!holds.ok) return holds;
    const signed = await endPublication(ctx, record, 'closed'); if (!signed.ok) return signed;
    const expiredAt = record.data.expiresAt;
    const { expiresAt: _expiry, ...data } = record.data;
    const saved = ctx.tx.repo(listingRepo).put(record.id, { ...data, status: 'expired', ...(signed.value ? { publicationCid: signed.value.cid } : {}) }, { expectedRevision: record.revision });
    if (!saved.ok) return saved;
    const archiveRecordId = ctx.ids.next();
    const evidence = ctx.tx.repo(archiveRecordRepo).put(archiveRecordId, { listingId: uuidv7().parse(record.id), ownerId: record.data.ownerId, status: 'expired', endedAt: expiredAt }, { expectedRevision: 0 });
    if (!evidence.ok) return evidence;
    ctx.emit(expired, { aggregate: { type: 'listing', id: record.id }, revision: saved.value.revision,
      payload: { listingId: uuidv7().parse(record.id), ownerId: record.data.ownerId, expiredAt } });
    options.emitChange(ctx, saved.value, 'expired');
    return ok({ archiveRecordId, expiredAt, ...(signed.value ? { envelope: signed.value } : {}) });
  }

  const archive = defineCommand({ name: 'bazaar.listing.archive', module: 'F01.S01.M04', capability: 'bazaar.listing.archive', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1), releaseHolds: z.boolean().default(false) }),
    async handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      if (found.value.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      return archiveOne(ctx, found.value, input.releaseHolds, ctx.clock.now());
    } });

  const close = defineCommand({ name: 'bazaar.listing.close', module: 'F01.S01.M04', capability: 'bazaar.listing.close', idempotent: true,
    input: z.strictObject({ listingId: uuidv7(), expectedRevision: z.int().min(1), closeReason: closeReasonSchema, closedWithRef: closeReferenceSchema.optional(), releaseHolds: z.boolean().default(false) }),
    async handler(ctx, input) {
      const found = owned(ctx, input.listingId); if (!found.ok) return found;
      const record = found.value;
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (!['published', 'unpublished', 'expired'].includes(record.data.status)) return err(appError('CONFLICT_STATE'));
      if ((record.data.kind === 'giveaway' && !['given', 'other'].includes(input.closeReason))
        || (record.data.kind === 'wanted' && !['fulfilled', 'other'].includes(input.closeReason))) return err(appError('VALIDATION_FAILED'));
      const observedAt = ctx.clock.now();
      const prior = activeArchiveRecord(ctx, record.id); if (!prior.ok) return prior;
      if (prior.value && (record.data.status !== 'expired' || prior.value.data.status !== 'expired'
        || prior.value.data.ownerId !== record.data.ownerId || Date.parse(prior.value.data.endedAt) > observedAt)) return err(appError('CONFLICT_STATE'));
      if (record.data.status === 'expired' && !prior.value) return err(appError('CONFLICT_STATE'));
      const holds = checkHolds(ctx, record, input.releaseHolds, observedAt); if (!holds.ok) return holds;
      const signed = await endPublication(ctx, record, 'closed'); if (!signed.ok) return signed;
      const { expiresAt: _expiry, ...data } = record.data;
      const saved = ctx.tx.repo(listingRepo).put(record.id, { ...data, status: 'closed', ...(signed.value ? { publicationCid: signed.value.cid } : {}) }, { expectedRevision: record.revision });
      if (!saved.ok) return saved;
      const archiveRecordId = prior.value?.id ?? ctx.ids.next();
      const evidence = ctx.tx.repo(archiveRecordRepo).put(archiveRecordId, {
        listingId: input.listingId, ownerId: record.data.ownerId, status: 'closed', closeReason: input.closeReason,
        ...(input.closedWithRef ? { closedWithRef: { ...input.closedWithRef, verified: false as const } } : {}),
        endedAt: prior.value?.data.endedAt ?? new Date(observedAt).toISOString(),
      }, { expectedRevision: prior.value?.revision ?? 0 });
      if (!evidence.ok) return evidence;
      ctx.emit(closed, { aggregate: { type: 'listing', id: record.id }, revision: saved.value.revision,
        payload: { listingId: input.listingId, ownerId: record.data.ownerId, closeReason: input.closeReason } });
      options.emitChange(ctx, saved.value, 'closed');
      return ok({ archiveRecordId, listingStatus: 'closed' as const, tombstoneQueued: false,
        ...(signed.value ? { envelope: signed.value, delivery: 'local-file-exchange' as const } : {}) });
    } });

  // The local scheduler dispatches with the unlocked owner; there is no privileged cross-vault actor.
  const expire = defineCommand({ name: 'bazaar.listing.expire', module: 'F01.S01.M04', capability: 'bazaar.listing.expire', idempotent: true,
    input: z.strictObject({ listingId: uuidv7() }), async handler(ctx, input) {
      const found = owned(ctx, input.listingId); return found.ok ? expireOne(ctx, found.value, ctx.clock.now()) : found;
    } });

  const sweep = defineCommand({ name: 'bazaar.listing.sweep', module: 'F01.S01.M04', capability: 'bazaar.listing.expire', idempotent: true,
    input: z.strictObject({ cursor: z.string().max(2000).optional(), limit: z.int().min(1).max(100).default(100) }),
    async handler(ctx, input) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      const page = ctx.tx.repo(listingRepo).query({ where: { owner: ctx.actor.id }, limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      if (!page.ok) return page;
      const observedAt = ctx.clock.now();
      let expiredCount = 0; let archivedCount = 0;
      const envelopes: SignedEnvelope[] = [];
      for (let record of page.value.items) {
        if (record.data.status === 'published' && record.data.expiresAt && Date.parse(record.data.expiresAt) <= observedAt) {
          const result = await expireOne(ctx, record, observedAt); if (!result.ok) return result;
          if (result.value.envelope) envelopes.push(result.value.envelope);
          expiredCount++;
          record = ctx.tx.repo(listingRepo).get(record.id)!;
        }
        if (record.data.status !== 'expired' && record.data.status !== 'closed') continue;
        const active = activeArchiveRecord(ctx, record.id); if (!active.ok) return active;
        if (!active.value || active.value.data.ownerId !== ctx.actor.id || active.value.data.status !== record.data.status) return err(appError('CONFLICT_STATE'));
        if (Date.parse(active.value.data.endedAt) + AUTO_ARCHIVE_AFTER_MS > observedAt) continue;
        const result = await archiveOne(ctx, record, false, observedAt); if (!result.ok) return result;
        archivedCount++;
      }
      return ok({ processed: page.value.items.length, expired: expiredCount, archived: archivedCount, envelopes,
        ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) });
    } });
  return { archive, close, expire, sweep, all: [archive, close, expire, sweep] as const };
}
