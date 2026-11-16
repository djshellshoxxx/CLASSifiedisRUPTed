import { appError, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, err, ok, timestamp, uuidv7, z, type CommandContext, type StoredRecord } from '@classrup/kernel';
import { listingRepo, type Listing } from './model.ts';

export const RESTORE_WINDOW_MS = 90 * 86400000;
export const archiveErrors = defineErrors({
  BAZAAR_ARCHIVE_HOLD_ACTIVE: { status: 409, retryable: false },
  BAZAAR_ARCHIVE_RESTORE_EXPIRED: { status: 410, retryable: false },
});
export const archiveRecordSchema = z.strictObject({
  listingId: uuidv7(), ownerId: z.string().min(1), status: z.enum(['archived', 'restored']),
  endedAt: timestamp(), archivedAt: timestamp(), restoreUntil: timestamp(), purgeAt: timestamp(), restoredAt: timestamp().optional(),
}).superRefine((row, ctx) => {
  if (Date.parse(row.restoreUntil) !== Date.parse(row.archivedAt) + RESTORE_WINDOW_MS || row.purgeAt !== row.restoreUntil
    || Date.parse(row.endedAt) > Date.parse(row.archivedAt)
    || (row.status === 'restored') !== (row.restoredAt !== undefined)
    || (row.restoredAt !== undefined && (Date.parse(row.restoredAt) < Date.parse(row.archivedAt) || Date.parse(row.restoredAt) > Date.parse(row.restoreUntil)))) {
    ctx.addIssue({ code: 'custom', message: 'Invalid archive lifecycle dates' });
  }
});
export const archiveRecordRepo = defineRepo({ type: 'bazaar.archive_record', schema: archiveRecordSchema,
  indexes: { owner: row => row.ownerId, listing: row => row.listingId, status: row => row.status, purge: row => row.purgeAt } });
const archived = defineEvent('bazaar.listing.archived', 1, 'P1', z.strictObject({ listingId: uuidv7(), ownerId: z.string(), archiveRecordId: uuidv7(), restoreUntil: timestamp() }));
const restored = defineEvent('bazaar.listing.restored', 1, 'P1', z.strictObject({ listingId: uuidv7(), ownerId: z.string(), archiveRecordId: uuidv7() }));

/** Called after the listing update, in the same transaction as any signed withdrawal. */
export function recordArchive(ctx: CommandContext, listing: StoredRecord<Listing>) {
  const repo = ctx.tx.repo(archiveRecordRepo);
  const prior = repo.query({ where: { listing: listing.id, status: 'archived' }, limit: 1 });
  if (!prior.ok) return prior;
  if (prior.value.items.length || prior.value.nextCursor) return err(appError('CONFLICT_STATE'));
  const archiveRecordId = ctx.ids.next();
  const observedAt = ctx.clock.now();
  const archivedAt = new Date(observedAt).toISOString();
  const restoreUntil = new Date(observedAt + RESTORE_WINDOW_MS).toISOString();
  const saved = repo.put(archiveRecordId, { listingId: uuidv7().parse(listing.id), ownerId: listing.data.ownerId,
    status: 'archived', endedAt: archivedAt, archivedAt, restoreUntil, purgeAt: restoreUntil }, { expectedRevision: 0 });
  if (!saved.ok) return saved;
  ctx.emit(archived, { aggregate: { type: 'listing', id: listing.id }, revision: listing.revision,
    payload: { listingId: uuidv7().parse(listing.id), ownerId: listing.data.ownerId, archiveRecordId, restoreUntil } });
  return ok({ archiveRecordId, restoreUntil });
}

export function archiveDefinitions() {
  const restore = defineCommand({ name: 'bazaar.listing.restore', module: 'F01.S01.M04', capability: 'bazaar.listing.restore', idempotent: true,
    input: z.strictObject({ archiveRecordId: uuidv7(), expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const repo = ctx.tx.repo(archiveRecordRepo); const record = repo.get(input.archiveRecordId);
      if (!record || ctx.actor.kind !== 'user' || record.data.ownerId !== ctx.actor.id) return err(appError('NOT_FOUND'));
      if (record.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (record.data.status !== 'archived') return err(appError('CONFLICT_STATE'));
      const observedAt = ctx.clock.now();
      if (observedAt > Date.parse(record.data.restoreUntil)) return err(archiveErrors.make('BAZAAR_ARCHIVE_RESTORE_EXPIRED'));
      // Do not re-date a record when a device clock moves backward.
      if (observedAt < Date.parse(record.data.archivedAt)) return err(appError('CONFLICT_STATE'));
      const listing = ctx.tx.repo(listingRepo).get(record.data.listingId);
      if (!listing || listing.data.ownerId !== ctx.actor.id) return err(appError('NOT_FOUND'));
      if (listing.data.status !== 'archived') return err(appError('CONFLICT_STATE'));
      const active = repo.query({ where: { listing: listing.id, status: 'archived' }, limit: 2 });
      if (!active.ok) return active;
      if (active.value.items.length !== 1 || active.value.nextCursor || active.value.items[0]!.id !== record.id) return err(appError('CONFLICT_STATE'));
      const { expiresAt: _expiry, ...data } = listing.data;
      const saved = ctx.tx.repo(listingRepo).put(listing.id, { ...data, status: 'unpublished' }, { expectedRevision: listing.revision });
      if (!saved.ok) return saved;
      const updated = repo.put(record.id, { ...record.data, status: 'restored', restoredAt: new Date(observedAt).toISOString() }, { expectedRevision: record.revision });
      if (!updated.ok) return updated;
      ctx.emit(restored, { aggregate: { type: 'listing', id: listing.id }, revision: saved.value.revision,
        payload: { listingId: record.data.listingId, ownerId: ctx.actor.id, archiveRecordId: input.archiveRecordId } });
      return ok({ listingId: listing.id, listingStatus: 'unpublished' as const });
    } });
  const get = defineQuery({ name: 'bazaar.archive_record.get', module: 'F01.S01.M04', capability: 'bazaar.archive_record.read',
    input: z.strictObject({ archiveRecordId: uuidv7() }), handler(ctx, input) {
      const record = ctx.tx.repo(archiveRecordRepo).get(input.archiveRecordId);
      return record && ctx.actor.kind === 'user' && record.data.ownerId === ctx.actor.id ? ok({ record }) : err(appError('NOT_FOUND'));
    } });
  const list = defineQuery({ name: 'bazaar.archive_record.list_mine', module: 'F01.S01.M04', capability: 'bazaar.archive_record.read',
    input: z.strictObject({ status: z.enum(['archived', 'restored']).optional(), listingId: uuidv7().optional(), cursor: z.string().max(2000).optional(), limit: z.int().min(1).max(50).default(50) }),
    handler(ctx, input) {
      if (ctx.actor.kind !== 'user') return err(appError('FORBIDDEN'));
      return ctx.tx.repo(archiveRecordRepo).query({ where: { owner: ctx.actor.id, ...(input.status ? { status: input.status } : {}), ...(input.listingId ? { listing: input.listingId } : {}) },
        limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
    } });
  return { restore, get, list, all: [restore, get, list] as const };
}
