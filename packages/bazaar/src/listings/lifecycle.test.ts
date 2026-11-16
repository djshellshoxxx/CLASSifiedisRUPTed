import { beforeAll, describe, expect, it } from 'vitest';
import { createTestKernel } from '@classrup/kernel/testing';
import { createIdentity, type UnlockedIdentity } from '@classrup/identity';
import { signEnvelope, verifyEnvelope } from '@classrup/federation';
import { archiveRecordRepo, archiveRecordSchema, bazaarDefinitions, inventoryHoldRepo, listingRepo, publicationRepo, type Listing } from './index.ts';

let identity: UnlockedIdentity;
beforeAll(async () => { identity = (await createIdentity('correct horse battery staple')).identity; });
function setup() {
  const k = createTestKernel();
  const actor = { kind: 'user' as const, id: identity.principal, roles: ['member'] };
  let rejectSigning = false;
  k.registry.add(...bazaarDefinitions({ categoryAllowed: () => true,
    signProjection: async (type, payload, seq, prev) => {
      if (rejectSigning) throw new Error('Locked signing key');
      return { ...await signEnvelope(identity, { type, payload, seq, prev, createdAt: new Date(k.clock.now()).toISOString() }) };
    }, verifyProjection: envelope => verifyEnvelope(envelope, { now: k.clock.now() }),
  }).all);
  const cmd = (name: string, value: unknown) => k.cmd(name, value, { actor });
  const listing = async (id: string) => {
    const r = await k.ask('bazaar.listing.get', { listingId: id }, { actor });
    if (!r.ok) throw new Error(r.error.code);
    return r.value.value as { id: string; revision: number; data: Listing };
  };
  async function publish(kind: 'sell' | 'giveaway' | 'wanted' = 'sell') {
    const listingId = k.ids.next();
    const create = await cmd('bazaar.listing.create', { listingId, kind, title: 'Private bicycle', description: 'Owner content', privateNotes: 'secret note',
      categoryId: k.ids.next(), condition: 'good', regionCell: 'c2b2', barterOptIn: true, value: { amount: '10000', currency: 'CAD' } });
    expect(create.ok).toBe(true);
    const result = await cmd('bazaar.listing.publish', { listingId, expectedRevision: 1, expiryDays: 1 });
    if (!result.ok) throw new Error(result.error.code);
    return { listingId, envelope: (result.value.value as { envelope: { cid: string } }).envelope };
  }
  return { k, actor, cmd, listing, publish, disableSigning: () => { rejectSigning = true; } };
}

describe('listing close and scheduled lifecycle', () => {
  it('closes atomically with a chained withdrawal and private owner-asserted completion reference', async () => {
    const { k, actor, cmd, publish, listing } = setup();
    const { listingId, envelope } = await publish();
    const closedWithRef = { type: 'deal', id: k.ids.next() };
    const input = { listingId, expectedRevision: 2, closeReason: 'sold', closedWithRef };
    const idempotencyKey = k.ids.next();
    const result = await k.cmd('bazaar.listing.close', input, { actor, idempotencyKey });
    expect(result.ok).toBe(true); if (!result.ok) return;
    const out = result.value.value as { archiveRecordId: string; envelope: unknown; tombstoneQueued: boolean };
    expect(out.tombstoneQueued).toBe(false);
    const signed = await verifyEnvelope(out.envelope, { now: k.clock.now() });
    expect(signed).toMatchObject({ type: 'classrup.alpha.tombstone/v1', prev: envelope.cid, seq: 2 });
    expect(signed.payload).toMatchObject({ reason: 'closed', listingId });
    expect(JSON.stringify(signed)).not.toContain(closedWithRef.id);
    const evidence = await k.ask('bazaar.archive_record.get', { archiveRecordId: out.archiveRecordId }, { actor });
    expect(evidence.ok && evidence.value.value).toMatchObject({ record: { data: { status: 'closed', closeReason: 'sold', closedWithRef: { ...closedWithRef, verified: false } } } });
    const events = [...k.events];
    expect(JSON.stringify(events.filter(e => e.type === 'bazaar.listing.closed'))).not.toContain(closedWithRef.id);
    expect(events.filter(e => e.type === 'bazaar.listing.closed')).toHaveLength(1);
    const replay = await k.cmd('bazaar.listing.close', input, { actor, idempotencyKey });
    expect(replay.ok && replay.value.value).toEqual(result.value.value);
    expect(k.events).toEqual(events);
    expect((await listing(listingId)).data).toMatchObject({ status: 'closed', privateNotes: 'secret note' });
  });

  it.each([['giveaway', 'sold'], ['wanted', 'given']] as const)('rejects inappropriate %s close reason %s without a mutation', async (kind, closeReason) => {
    const { k, cmd, publish, listing } = setup();
    const { listingId } = await publish(kind); const events = [...k.events];
    const result = await cmd('bazaar.listing.close', { listingId, expectedRevision: 2, closeReason });
    expect(!result.ok && result.error.code).toBe('VALIDATION_FAILED');
    expect(k.events).toEqual(events); expect((await listing(listingId)).data.status).toBe('published');
  });

  it('rejects a forged verified completion, foreign owner and stale revision', async () => {
    const { k, cmd, publish, listing } = setup(); const { listingId } = await publish();
    const input = { listingId, expectedRevision: 2, closeReason: 'sold' };
    const events = [...k.events];
    const verified = await cmd('bazaar.listing.close', { ...input, closedWithRef: { type: 'deal', id: k.ids.next(), verified: true } });
    expect(!verified.ok && verified.error.code).toBe('VALIDATION_FAILED');
    const foreign = await k.cmd('bazaar.listing.close', input, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    const stale = await cmd('bazaar.listing.close', { ...input, expectedRevision: 1 });
    expect(!stale.ok && stale.error.code).toBe('CONFLICT_REVISION');
    expect(k.events).toEqual(events); expect((await listing(listingId)).revision).toBe(2);
  });

  it('requires explicit hold release and rolls it back when signing fails', async () => {
    const { k, cmd, publish, listing, disableSigning } = setup(); const { listingId } = await publish();
    const holdId = k.ids.next();
    expect((await cmd('bazaar.inventory.reserve', { listingId, expectedRevision: 2, holdId, subjectId: k.ids.next(), revisionHash: 'immutable-proposal-hash', expiresAt: new Date(k.clock.now() + 10000).toISOString() })).ok).toBe(true);
    const input = { listingId, expectedRevision: 2, closeReason: 'sold' };
    const blocked = await cmd('bazaar.listing.close', input);
    expect(!blocked.ok && blocked.error.code).toBe('BAZAAR_ARCHIVE_HOLD_ACTIVE');
    const events = [...k.events]; disableSigning();
    expect((await cmd('bazaar.listing.close', { ...input, releaseHolds: true })).ok).toBe(false);
    expect(k.events).toEqual(events); expect((await listing(listingId)).data.status).toBe('published');
    const hold = await k.storage.read(tx => tx.records.get(k.tenantId, inventoryHoldRepo.type, holdId));
    expect(hold?.data).toMatchObject({ state: 'active' });
  });

  it.each(['close', 'archive'] as const)('explicitly releases local holds together with %s', async action => {
    const { k, cmd, publish, listing } = setup(); const { listingId } = await publish();
    const holdId = k.ids.next();
    await cmd('bazaar.inventory.reserve', { listingId, expectedRevision: 2, holdId, subjectId: k.ids.next(), revisionHash: 'immutable-proposal-hash', expiresAt: new Date(k.clock.now() + 10000).toISOString() });
    const result = await cmd(`bazaar.listing.${action}`, { listingId, expectedRevision: 2, releaseHolds: true, ...(action === 'close' ? { closeReason: 'sold' } : {}) });
    expect(result.ok).toBe(true);
    const hold = await k.storage.read(tx => tx.records.get(k.tenantId, inventoryHoldRepo.type, holdId));
    expect(hold?.data).toMatchObject({ state: 'released' });
    expect((await listing(listingId)).data.status).toBe(action === 'close' ? 'closed' : 'archived');
  });

  it('expires only at the signed deadline, remains ended after clock rollback, and replays without another tombstone', async () => {
    const { k, cmd, publish, listing } = setup(); const { listingId } = await publish();
    const deadline = k.clock.now() + 86400000;
    k.clock.advance(86400000 - 1);
    const early = await cmd('bazaar.listing.expire', { listingId });
    expect(!early.ok && early.error.code).toBe('CONFLICT_STATE');
    k.clock.advance(1);
    const result = await cmd('bazaar.listing.expire', { listingId });
    expect(result.ok && result.value.value).toMatchObject({ expiredAt: new Date(deadline).toISOString() });
    expect((await listing(listingId)).data.status).toBe('expired');
    const events = [...k.events];
    k.clock.set(k.clock.now() - 86400000);
    const replay = await cmd('bazaar.listing.expire', { listingId });
    expect(replay.ok).toBe(true); expect(k.events).toEqual(events);
    expect((await listing(listingId)).data.status).toBe('expired');
  });

  it('rolls back the entire sweep if an overdue publication cannot be signed', async () => {
    const { k, cmd, publish, listing, disableSigning } = setup(); const { listingId } = await publish();
    k.clock.advance(86400000); const events = [...k.events]; disableSigning();
    expect((await cmd('bazaar.listing.sweep', {})).ok).toBe(false);
    expect(k.events).toEqual(events); expect((await listing(listingId)).data.status).toBe('published');
    const records = await k.storage.read(tx => tx.records.query({ tenant: k.tenantId, type: archiveRecordRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 }));
    expect(records).toEqual([]);
  });

  it('auto-archives after thirty days using one recovery window and preserves the first end date', async () => {
    const { k, actor, cmd, publish, listing } = setup(); const { listingId } = await publish();
    const result = await cmd('bazaar.listing.close', { listingId, expectedRevision: 2, closeReason: 'sold' });
    if (!result.ok) throw new Error(result.error.code);
    const { archiveRecordId } = result.value.value as { archiveRecordId: string };
    const endedAt = k.clock.now();
    k.clock.advance(30 * 86400000 - 1);
    const before = await cmd('bazaar.listing.sweep', {}); expect(before.ok && before.value.value).toMatchObject({ archived: 0 });
    k.clock.advance(1);
    const after = await cmd('bazaar.listing.sweep', {}); expect(after.ok && after.value.value).toMatchObject({ archived: 1 });
    const evidence = await k.ask('bazaar.archive_record.get', { archiveRecordId }, { actor });
    expect(evidence.ok && evidence.value.value).toMatchObject({ record: { revision: 2, data: { status: 'archived', closeReason: 'sold', endedAt: new Date(endedAt).toISOString(), restoreUntil: new Date(k.clock.now() + 90 * 86400000).toISOString() } } });
    expect((await listing(listingId)).data.status).toBe('archived');
    expect((await cmd('bazaar.listing.restore', { archiveRecordId, expectedRevision: 2 })).ok).toBe(true);
    expect((await listing(listingId)).data.status).toBe('unpublished');
    const republish = await cmd('bazaar.listing.publish', { listingId, expectedRevision: 5 });
    expect(republish.ok).toBe(true); if (!republish.ok) return;
    expect((await verifyEnvelope((republish.value.value as { envelope: unknown }).envelope, { now: k.clock.now() })).seq).toBe(3);
  });

  it('catches up after an offline month, then repeats without duplicate events or archive records', async () => {
    const { k, cmd, publish, listing } = setup(); const { listingId } = await publish();
    k.clock.advance(32 * 86400000);
    const first = await cmd('bazaar.listing.sweep', {});
    expect(first.ok && first.value.value).toMatchObject({ expired: 1, archived: 1 });
    expect((await listing(listingId)).data.status).toBe('archived'); const events = [...k.events];
    const again = await cmd('bazaar.listing.sweep', {});
    expect(again.ok && again.value.value).toMatchObject({ expired: 0, archived: 0 }); expect(k.events).toEqual(events);
    const records = await k.storage.read(tx => tx.records.query({ tenant: k.tenantId, type: archiveRecordRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 }));
    expect(records).toHaveLength(1); expect(records[0]?.revision).toBe(2);
  });

  it('paginates bounded sweep work and cannot change another owner’s listing', async () => {
    const { k, cmd, publish, listing } = setup(); const a = await publish(); const b = await publish(); const c = await publish();
    k.clock.advance(86400000);
    const foreign = await k.cmd('bazaar.listing.expire', { listingId: a.listingId }, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    const page = await cmd('bazaar.listing.sweep', { limit: 2 });
    expect(page.ok).toBe(true); if (!page.ok) return;
    const result = page.value.value as { expired: number; nextCursor: string };
    expect(result.expired).toBe(2); expect(result.nextCursor).toBeTypeOf('string');
    const last = await cmd('bazaar.listing.sweep', { limit: 2, cursor: result.nextCursor });
    expect(last.ok && last.value.value).toMatchObject({ processed: 1, expired: 1 });
    expect(last.ok && last.value.value).not.toHaveProperty('nextCursor');
    expect(await Promise.all([a, b, c].map(async row => (await listing(row.listingId)).data.status))).toEqual(['expired', 'expired', 'expired']);
  });

  it('validates ended evidence without inventing recovery dates and rejects forged completion verification', () => {
    const { k } = setup(); const base = { listingId: k.ids.next(), ownerId: identity.principal, endedAt: new Date(k.clock.now()).toISOString() };
    expect(archiveRecordSchema.safeParse({ ...base, status: 'expired' }).success).toBe(true);
    expect(archiveRecordSchema.safeParse({ ...base, status: 'closed', closeReason: 'sold' }).success).toBe(true);
    expect(archiveRecordSchema.safeParse({ ...base, status: 'closed' }).success).toBe(false);
    expect(archiveRecordSchema.safeParse({ ...base, status: 'expired', archivedAt: base.endedAt }).success).toBe(false);
    expect(archiveRecordSchema.safeParse({ ...base, status: 'closed', closeReason: 'sold', closedWithRef: { type: 'deal', id: k.ids.next(), verified: true } }).success).toBe(false);
  });

  it('exports the verified current owner publication and later its withdrawal without leaking private content', async () => {
    const { k, actor, cmd, publish } = setup(); const { listingId, envelope } = await publish();
    const first = await k.ask('bazaar.listing.publication', { listingId }, { actor });
    expect(first.ok && first.value.value).toEqual({ envelope });
    const foreign = await k.ask('bazaar.listing.publication', { listingId }, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    const arbitrary = await k.ask('bazaar.listing.publication', { listingId, cid: envelope.cid }, { actor });
    expect(!arbitrary.ok && arbitrary.error.code).toBe('VALIDATION_FAILED');
    const ended = await cmd('bazaar.listing.close', { listingId, expectedRevision: 2, closeReason: 'sold' });
    if (!ended.ok) throw new Error(ended.error.code);
    const second = await k.ask('bazaar.listing.publication', { listingId }, { actor });
    expect(second.ok && second.value.value).toEqual({ envelope: (ended.value.value as { envelope: unknown }).envelope });
    expect(JSON.stringify(second)).not.toContain('secret note');
  });

  it('refuses corrupt publication bytes and a legacy archived listing that still points to a live publication', async () => {
    const { k, actor, publish } = setup(); const { listingId, envelope } = await publish();
    const row = await k.storage.read(tx => tx.records.get<{ envelope: { cid: string }; listingId: string }>(k.tenantId, publicationRepo.type, envelope.cid));
    if (!row) throw new Error('Missing publication');
    await k.storage.transaction(tx => tx.records.put({ tenant: k.tenantId, type: publicationRepo.type, id: row.id,
      expectedRevision: row.revision, now: k.clock.now(), idx: [listingId, null, null, null], data: { ...row.data, envelope: { ...row.data.envelope, sig: 'AAAA' } } }));
    const invalid = await k.ask('bazaar.listing.publication', { listingId }, { actor });
    expect(!invalid.ok && invalid.error.code).toBe('VALIDATION_FAILED');
    await k.storage.transaction(tx => tx.records.put({ tenant: k.tenantId, type: publicationRepo.type, id: row.id,
      expectedRevision: row.revision + 1, now: k.clock.now(), idx: [listingId, null, null, null], data: row.data }));
    const listing = await k.storage.read(tx => tx.records.get<Listing>(k.tenantId, listingRepo.type, listingId));
    if (!listing) throw new Error('Missing listing');
    await k.storage.transaction(tx => tx.records.put({ tenant: k.tenantId, type: listingRepo.type, id: listingId,
      expectedRevision: listing.revision, now: k.clock.now(), idx: [identity.principal, 'archived', null, null], data: { ...listing.data, status: 'archived' } }));
    const legacy = await k.ask('bazaar.listing.publication', { listingId }, { actor });
    expect(!legacy.ok && legacy.error.code).toBe('VALIDATION_FAILED');
  });
});
