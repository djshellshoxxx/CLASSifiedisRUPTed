import { beforeAll, describe, expect, it } from 'vitest';
import { defineCommand, z } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { createIdentity, type UnlockedIdentity } from '@classrup/identity';
import { signEnvelope, verifyEnvelope } from '@classrup/federation';
import { discoveryDefinitions } from '@classrup/discovery';
import { bazaarDefinitions, releaseSubjectReservations, validateListingRevision, listingRevisionRepo, archiveRecordRepo } from './index.ts';

let identity: UnlockedIdentity;
beforeAll(async () => { identity = (await createIdentity('correct horse battery staple')).identity; });
function setup(alter?: (seq: number, prev: string | null, unrelatedCid: string) => { seq: number; prev: string | null }) {
  const k = createTestKernel();
  const categoryId = k.ids.next();
  const actor = { kind: 'user' as const, id: identity.principal, roles: ['member'] };
  const defs = bazaarDefinitions({ categoryAllowed: id => id === categoryId,
    signProjection: async (type, payload, seq, prev) => {
      const createdAt = new Date(k.clock.now()).toISOString();
      const unrelated = await signEnvelope(identity, { type: 'classrup.test/v1', payload: {}, seq: 1, prev: null, createdAt });
      return { ...await signEnvelope(identity, { type, payload, createdAt, ...(alter ? alter(seq, prev, unrelated.cid) : { seq, prev }) }) };
    },
    verifyProjection: envelope => verifyEnvelope(envelope, { now: k.clock.now() }),
  });
  k.registry.add(...defs.all, ...discoveryDefinitions({ verifyEnvelope: envelope => verifyEnvelope(envelope, { now: k.clock.now() }) }).all);
  const input = { listingId: k.ids.next(), kind: 'sell' as const, title: 'Mountain bicycle', description: 'A good bicycle for a trade.', categoryId,
    condition: 'good' as const, regionCell: 'c2b2', barterOptIn: true, value: { amount: '10000', currency: 'CAD' }, privateNotes: 'Never publish this', tags: [] };
  const cmd = (name: string, value: unknown) => k.cmd(name, value, { actor });
  return { k, input, actor, cmd };
}
describe('LocalBazaar persistent command path', () => {
  it('creates, publishes signed public data, unpublishes and archives with atomic revision events', async () => {
    const { k, input, cmd } = setup();
    expect((await cmd('bazaar.listing.create', input)).ok).toBe(true);
    const publish = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    expect(publish.ok).toBe(true);
    if (!publish.ok) return;
    const output = publish.value.value as { envelope: unknown };
    const verified = await verifyEnvelope(output.envelope, { now: k.clock.now() });
    expect(verified.seq).toBe(1);
    expect(verified.payload).not.toHaveProperty('privateNotes');
    expect(verified.payload).not.toHaveProperty('onHand');
    expect((await cmd('discovery.listing.retain', { envelope: output.envelope })).ok).toBe(true);
    const unpublish = await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    expect(unpublish.ok).toBe(true);
    if (!unpublish.ok) return;
    expect((await cmd('discovery.listing.retain', { envelope: (unpublish.value.value as { envelope: unknown }).envelope })).ok).toBe(true);
    expect((await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 3 })).ok).toBe(true);
    expect(k.events.filter(e => e.type === 'bazaar.listing.changed')).toHaveLength(4);
  });
  it.each(['publish', 'unpublish', 'reserve'] as const)('rejects validly signed wrong sequences during %s without changing records or events', async action => {
    let corrupt = false;
    const { k, input, cmd } = setup((seq, prev, unrelatedCid) => corrupt ? { seq: seq + 1, prev: prev ?? unrelatedCid } : { seq, prev });
    await cmd('bazaar.listing.create', input);
    if (action !== 'publish') await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const records = () => k.storage.read(tx => ['bazaar.listing', 'bazaar.publication', 'bazaar.inventory_hold'].map(type =>
      tx.records.query({ tenant: k.tenantId, type, filters: [], orderSlot: 0, dir: 'asc', limit: 100 })));
    const before = await records();
    const events = [...k.events];
    corrupt = true;
    const result = action === 'reserve'
      ? await cmd('bazaar.inventory.reserve', { listingId: input.listingId, expectedRevision: 2, holdId: k.ids.next(), subjectId: k.ids.next(), revisionHash: 'sha256-immutable-proposal', expiresAt: new Date(k.clock.now() + 1000).toISOString() })
      : await cmd(`bazaar.listing.${action}`, { listingId: input.listingId, expectedRevision: action === 'publish' ? 1 : 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    expect(await records()).toEqual(before);
    expect(k.events).toEqual(events);
  });
  it('rejects a correctly sequenced tombstone signed against the wrong parent', async () => {
    let corrupt = false;
    const { k, input, cmd } = setup((seq, prev, unrelatedCid) => ({ seq, prev: corrupt ? unrelatedCid : prev }));
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const before = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor: { kind: 'user', id: identity.principal, roles: ['member'] } });
    const events = [...k.events];
    corrupt = true;
    const result = await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('FORBIDDEN');
    const after = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor: { kind: 'user', id: identity.principal, roles: ['member'] } });
    expect(after.ok && after.value.value).toEqual(before.ok && before.value.value);
    expect(k.events).toEqual(events);
    expect(await k.storage.read(tx => tx.records.query({ tenant: k.tenantId, type: 'bazaar.publication', filters: [], orderSlot: 0, dir: 'asc', limit: 100 }))).toHaveLength(1);
  });
  it('rejects unknown/private-location fields, foreign edits, and stale updates without additional events', async () => {
    const { k, input, actor, cmd } = setup();
    expect((await cmd('bazaar.listing.create', { ...input, latitude: 42 })).ok).toBe(false);
    expect((await cmd('bazaar.listing.create', input)).ok).toBe(true);
    const { kind: _kind, ...edit } = input;
    const foreign = await k.cmd('bazaar.listing.edit', { ...edit, expectedRevision: 1 }, { actor: k.user() });
    expect(foreign.ok).toBe(false);
    expect((await cmd('bazaar.listing.edit', { ...edit, expectedRevision: 1, title: 'Updated bicycle' })).ok).toBe(true);
    const stale = await k.cmd('bazaar.listing.edit', { ...edit, expectedRevision: 1 }, { actor });
    expect(stale.ok).toBe(false);
    expect(k.events.filter(e => e.type === 'bazaar.listing.changed')).toHaveLength(2);
  });
  it('single-item reservations reject races and expire without multiplying available stock', async () => {
    const { k, input, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const reservation = { listingId: input.listingId, expectedRevision: 2, holdId: k.ids.next(), subjectId: k.ids.next(), revisionHash: 'sha256-immutable-proposal', expiresAt: new Date(k.clock.now() + 1000).toISOString() };
    const results = await Promise.all([cmd('bazaar.inventory.reserve', reservation), cmd('bazaar.inventory.reserve', { ...reservation, holdId: k.ids.next() })]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
    k.clock.advance(1001);
    expect((await cmd('bazaar.inventory.reserve', { ...reservation, holdId: k.ids.next(), expiresAt: new Date(k.clock.now() + 1000).toISOString() })).ok).toBe(true);
  });
  it('releases subject holds atomically and emits an inventory revision event', async () => {
    const { k, input, cmd } = setup();
    k.registry.add(defineCommand({ name: 'test.subject.release', module: 'F02', capability: 'test.subject.release', idempotent: true,
      input: z.strictObject({ subjectId: z.string() }), handler: (ctx, data) => releaseSubjectReservations(ctx, data.subjectId) }));
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const subjectId = k.ids.next();
    const holdId = k.ids.next();
    const reservation = { listingId: input.listingId, expectedRevision: 2, holdId, subjectId, revisionHash: 'sha256-immutable-proposal', expiresAt: new Date(k.clock.now() + 1000).toISOString() };
    expect((await cmd('bazaar.inventory.reserve', reservation)).ok).toBe(true);
    const released = await cmd('test.subject.release', { subjectId });
    expect(released.ok && released.value.value).toBe(1);
    expect(k.events.filter(e => e.type === 'bazaar.inventory.changed').map(e => [e.aggregate.id, e.revision])).toEqual([[holdId, 1], [holdId, 2]]);
    expect((await cmd('bazaar.inventory.reserve', { ...reservation, holdId: k.ids.next() })).ok).toBe(true);
  });
  it('signing failure leaves listing private and emits no publish event', async () => {
    const k = createTestKernel();
    k.registry.add(...bazaarDefinitions({ categoryAllowed: () => true, signProjection: async () => { throw new Error('locked'); }, verifyProjection: verifyEnvelope }).all);
    const id = k.ids.next();
    await k.cmd('bazaar.listing.create', { listingId: id, kind: 'giveaway', title: 'Free bicycle', description: 'A bicycle for somebody.', categoryId: k.ids.next(), condition: 'good', regionCell: 'c2b2' });
    expect((await k.cmd('bazaar.listing.publish', { listingId: id, expectedRevision: 1 })).ok).toBe(false);
    const current = await k.ask('bazaar.listing.get', { listingId: id });
    expect(current.ok && (current.value.value as { data: { status: string } }).data.status).toBe('draft');
    expect(k.events).toHaveLength(1);
  });
});

describe('verified retained discovery', () => {
  it('freezes same-revision forks, excludes them from search and rejects later overwrite', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    const published = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    if (!published.ok) throw new Error(published.error.code);
    const original = (published.value.value as { envelope: unknown }).envelope;
    const verified = await verifyEnvelope(original, { now: k.clock.now() });
    await cmd('discovery.listing.retain', { envelope: original });
    const fork = await signEnvelope(identity, { type: verified.type, createdAt: verified.createdAt, seq: verified.seq, prev: verified.prev,
      payload: { ...(verified.payload as Record<string, unknown>), title: 'Forked bicycle' } });
    const retained = await cmd('discovery.listing.retain', { envelope: fork });
    expect(retained.ok && (retained.value.value as { state: string }).state).toBe('conflicted');
    const search = await k.ask('discovery.listing.search', { barterOnly: true }, { actor });
    expect(search.ok && (search.value.value as { items: unknown[] }).items).toEqual([]);
    const newer = await signEnvelope(identity, { type: verified.type, createdAt: verified.createdAt, seq: 2, prev: verified.cid,
      payload: { ...(verified.payload as Record<string, unknown>), revision: 3 } });
    expect((await cmd('discovery.listing.retain', { envelope: newer })).ok).toBe(false);
  });
  it('rejects invalid signatures and reports expired records excluded after time advances', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    const published = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1, expiryDays: 1 });
    if (!published.ok) throw new Error(published.error.code);
    const envelope = (published.value.value as { envelope: Record<string, unknown> }).envelope;
    expect((await cmd('discovery.listing.retain', { envelope: { ...envelope, sig: 'AAAA' } })).ok).toBe(false);
    expect((await cmd('discovery.listing.retain', { envelope })).ok).toBe(true);
    k.clock.advance(86400001);
    const search = await k.ask('discovery.listing.search', {}, { actor });
    expect(search.ok && (search.value.value as { items: unknown[] }).items).toEqual([]);
    expect(search.ok && (search.value.value as { staleOrExcluded: number }).staleOrExcluded).toBe(1);
  });
  it('keeps owner-only public snapshots after publication without copying private notes', async () => {
    const { k, input, actor, cmd } = setup();
    const history = () => k.ask('bazaar.listing_revision.list', { listingId: input.listingId }, { actor });
    await cmd('bazaar.listing.create', input);
    const { kind: _kind, ...edit } = input;
    await cmd('bazaar.listing.edit', { ...edit, title: 'Draft bicycle', expectedRevision: 1 });
    const drafts = await history();
    expect(drafts.ok && (drafts.value.value as { items: unknown[] }).items).toEqual([]);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 2 });
    await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 3 });
    await cmd('bazaar.listing.edit', { ...edit, title: 'Updated bicycle', condition: 'fair', expectedRevision: 4 });
    const result = await history();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const items = (result.value.value as { items: Array<{ data: { revisionNo: number; material: boolean; wasPublic: boolean; snapshot: { title: string }; changedFields: string[] } }> }).items;
    expect(items.map(row => row.data.revisionNo)).toEqual([5, 3]);
    expect(items[0]!.data.material).toBe(true);
    expect(items[0]!.data.wasPublic).toBe(false);
    expect(items[1]!.data.wasPublic).toBe(true);
    expect(items[0]!.data.changedFields).toEqual(['title', 'condition']);
    expect(items[1]!.data.snapshot.title).toBe('Draft bicycle');
    expect(JSON.stringify(items)).not.toContain('Never publish this');
    expect(JSON.stringify(items)).not.toContain('privateNotes');
    const foreign = await k.ask('bazaar.listing_revision.list', { listingId: input.listingId }, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    const read = await k.ask('bazaar.listing_revision.get', { listingId: input.listingId, revisionNo: 3 }, { actor });
    expect(read.ok && (read.value.value as { revision: { data: { snapshot: { title: string } } } }).revision.data.snapshot.title).toBe('Draft bicycle');
    const events = k.events.filter(event => event.type === 'bazaar.listing.edited');
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain('Updated bicycle');
    expect(JSON.stringify(events)).not.toContain('Never publish this');
  });

  it('limits public history edits atomically and paginates immutable snapshots', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    const { kind: _kind, ...edit } = input;
    for (let index = 0; index < 20; index++) {
      expect((await cmd('bazaar.listing.edit', { ...edit, title: `Edited bicycle ${index}`, expectedRevision: 3 + index })).ok).toBe(true);
    }
    const before = [...k.events];
    const denied = await cmd('bazaar.listing.edit', { ...edit, title: 'Too many edits', expectedRevision: 23 });
    expect(!denied.ok && denied.error.code).toBe('RATE_LIMITED');
    expect(k.events).toEqual(before);
    const page = await k.ask('bazaar.listing_revision.list', { listingId: input.listingId, limit: 1 }, { actor });
    if (!page.ok) throw new Error(page.error.code);
    const first = page.value.value as { items: Array<{ data: unknown }>; nextCursor?: string };
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();
    await expect(validateListingRevision(first.items[0]!.data)).resolves.toBeUndefined();
    const forged = { ...(first.items[0]!.data as object), snapshotHash: `sha256-${'0'.repeat(64)}` };
    await expect(validateListingRevision(forged)).rejects.toThrow('snapshot hash mismatch');
    const second = await k.ask('bazaar.listing_revision.list', { listingId: input.listingId, limit: 1, cursor: first.nextCursor }, { actor });
    expect(second.ok && (second.value.value as { items: unknown[] }).items).not.toEqual(first.items);
    k.clock.advance(3600001);
    expect((await cmd('bazaar.listing.edit', { ...edit, title: 'After rate recovery', expectedRevision: 23 })).ok).toBe(true);
  });

  it('caps history at 100 without blocking archive, and rolls back failed edits', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    const { kind: _kind, ...edit } = input;
    for (let index = 0; index < 99; index++) {
      k.clock.advance(3600001);
      expect((await cmd('bazaar.listing.edit', { ...edit, title: `History bicycle ${index}`, expectedRevision: 3 + index })).ok).toBe(true);
    }
    const before = [...k.events];
    const denied = await cmd('bazaar.listing.edit', { ...edit, title: 'Must not be saved', expectedRevision: 102 });
    expect(!denied.ok && denied.error.code).toBe('BAZAAR_EDIT_REVISION_LIMIT');
    expect(k.events).toEqual(before);
    const current = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor });
    expect(current.ok && (current.value.value as { revision: number; data: { title: string } }).revision).toBe(102);
    expect(current.ok && (current.value.value as { data: { title: string } }).data.title).toBe('History bicycle 98');
    expect((await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 102 })).ok).toBe(true);
  });

  it('keeps private-only edits out of history and marks changed declared values as material', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    const { kind: _kind, ...edit } = input;
    await cmd('bazaar.listing.edit', { ...edit, privateNotes: 'private-only-edit-canary', expectedRevision: 3 });
    const first = await k.ask('bazaar.listing_revision.list', { listingId: input.listingId }, { actor });
    expect(first.ok && (first.value.value as { items: unknown[] }).items).toHaveLength(1);
    await cmd('bazaar.listing.edit', { ...edit, privateNotes: 'private-only-edit-canary', value: { amount: '10001', currency: 'CAD' }, expectedRevision: 4 });
    const current = await k.ask('bazaar.listing_revision.get', { listingId: input.listingId, revisionNo: 5 }, { actor });
    expect(current.ok && (current.value.value as { revision: { data: { material: boolean; changedFields: string[] } } }).revision.data.material).toBe(true);
    expect(current.ok && (current.value.value as { revision: { data: { changedFields: string[] } } }).revision.data.changedFields).toEqual(['value']);
    expect(JSON.stringify(current)).not.toContain('private-only-edit-canary');
    const events = [...k.events];
    expect((await cmd('bazaar.listing.edit', { ...edit, expectedRevision: 4 })).ok).toBe(false);
    expect(k.events).toEqual(events);
  });

  it('rejects corrupt snapshot hashes on list and get instead of showing them as evidence', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const stored = await k.storage.read(tx => tx.records.query({ tenant: k.tenantId, type: listingRevisionRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 1 })[0]);
    if (!stored) throw new Error('Missing history');
    await k.storage.transaction(tx => tx.records.put({ tenant: k.tenantId, type: listingRevisionRepo.type, id: stored.id, data: { ...(stored.data as object), snapshotHash: `sha256-${'0'.repeat(64)}` }, idx: [input.listingId, '0000000000000002', null, null], expectedRevision: 1, now: k.clock.now() }));
    for (const [name, extra] of [['list', {}], ['get', { revisionNo: 2 }]] as const) {
      const result = await k.ask(`bazaar.listing_revision.${name}`, { listingId: input.listingId, ...extra }, { actor });
      expect(!result.ok && result.error.code).toBe('VALIDATION_FAILED');
    }
  });

});


describe('owner archive and restore lifecycle', () => {
  it('archives a draft and restores it unpublished at the 90-day boundary, preserving private data', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    const archived = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 1 });
    expect(archived.ok).toBe(true); if (!archived.ok) return;
    const result = archived.value.value as { archiveRecordId: string; restoreUntil: string };
    expect(Date.parse(result.restoreUntil)).toBe(k.clock.now() + 90 * 86400000);
    const foreign = await k.ask('bazaar.archive_record.get', { archiveRecordId: result.archiveRecordId }, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    const denied = await k.cmd('bazaar.listing.restore', { archiveRecordId: result.archiveRecordId, expectedRevision: 1 }, { actor: k.user() });
    expect(!denied.ok && denied.error.code).toBe('NOT_FOUND');
    k.clock.advance(90 * 86400000);
    const restored = await cmd('bazaar.listing.restore', { archiveRecordId: result.archiveRecordId, expectedRevision: 1 });
    expect(restored.ok).toBe(true);
    const current = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor });
    expect(current.ok && (current.value.value as { data: { status: string; privateNotes: string } }).data).toMatchObject({ status: 'unpublished', privateNotes: input.privateNotes });
    const replay = await cmd('bazaar.listing.restore', { archiveRecordId: result.archiveRecordId, expectedRevision: 2 });
    expect(!replay.ok && replay.error.code).toBe('CONFLICT_STATE');
  });
  it('archives a published listing with a verified chained tombstone, without republishing on restore', async () => {
    const { k, input, actor, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    const pub = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    if (!pub.ok) throw new Error(pub.error.code);
    const original = (pub.value.value as { envelope: { cid: string } }).envelope;
    await cmd('discovery.listing.retain', { envelope: original });
    const archived = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 2 });
    expect(archived.ok).toBe(true); if (!archived.ok) return;
    const output = archived.value.value as { archiveRecordId: string; envelope: unknown };
    const tombstone = await verifyEnvelope(output.envelope, { now: k.clock.now() });
    expect(tombstone.type).toBe('classrup.alpha.tombstone/v1'); expect(tombstone.prev).toBe(original.cid); expect(tombstone.seq).toBe(2);
    expect(tombstone.payload).not.toHaveProperty('privateNotes');
    expect((await cmd('discovery.listing.retain', { envelope: output.envelope })).ok).toBe(true);
    expect((await cmd('bazaar.listing.restore', { archiveRecordId: output.archiveRecordId, expectedRevision: 1 })).ok).toBe(true);
    const search = await k.ask('discovery.listing.search', {}, { actor });
    expect(search.ok && (search.value.value as { items: unknown[] }).items).toHaveLength(0);
    const republished = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 4 });
    expect(republished.ok).toBe(true); if (!republished.ok) return;
    const next = await verifyEnvelope((republished.value.value as { envelope: unknown }).envelope, { now: k.clock.now() });
    expect(next.seq).toBe(3); expect(next.prev).toBe(tombstone.cid);
  });
  it('rejects stale restore revisions and expired restore windows without mutation', async () => {
    const { k, input, cmd } = setup();
    await cmd('bazaar.listing.create', input);
    const archived = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 1 });
    if (!archived.ok) throw new Error(archived.error.code);
    const { archiveRecordId } = archived.value.value as { archiveRecordId: string };
    const before = [...k.events];
    const stale = await cmd('bazaar.listing.restore', { archiveRecordId, expectedRevision: 2 });
    expect(!stale.ok && stale.error.code).toBe('CONFLICT_REVISION');
    k.clock.advance(90 * 86400000 + 1);
    const expired = await cmd('bazaar.listing.restore', { archiveRecordId, expectedRevision: 1 });
    expect(!expired.ok && expired.error.code).toBe('BAZAAR_ARCHIVE_RESTORE_EXPIRED'); expect(k.events).toEqual(before);
  });
  it('refuses archive while an active inventory hold exists, and rolls back invalid tombstone signatures', async () => {
    let corrupt = false;
    const { k, input, actor, cmd } = setup((seq, prev, other) => ({ seq, prev: corrupt ? other : prev }));
    await cmd('bazaar.listing.create', input);
    await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 1 });
    const holdId = k.ids.next();
    await cmd('bazaar.inventory.reserve', { listingId: input.listingId, expectedRevision: 2, holdId, subjectId: k.ids.next(), revisionHash: 'immutable-proposal-hash', expiresAt: new Date(k.clock.now() + 1000).toISOString() });
    const held = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 2 });
    expect(!held.ok && held.error.code).toBe('BAZAAR_ARCHIVE_HOLD_ACTIVE');
    await cmd('bazaar.inventory.release', { holdId, expectedRevision: 1 });
    corrupt = true;
    const before = [...k.events];
    const result = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 2 });
    expect(!result.ok && result.error.code).toBe('FORBIDDEN'); expect(k.events).toEqual(before);
    const records = await k.ask('bazaar.archive_record.list_mine', {}, { actor });
    expect(records.ok && (records.value.value as { items: unknown[] }).items).toEqual([]);
  });
});


it('paginates all owner listings newest first, including beyond 50 archived records, without exposing another owner', async () => {
  const { k, input, actor, cmd } = setup();
  const ids: string[] = [];
  for (let i = 0; i < 55; i++) {
    const listingId = k.ids.next(); ids.push(listingId);
    expect((await cmd('bazaar.listing.create', { ...input, listingId })).ok).toBe(true);
    expect((await cmd('bazaar.listing.archive', { listingId, expectedRevision: 1 })).ok).toBe(true);
  }
  const first = await k.ask('bazaar.listing.list', {}, { actor });
  if (!first.ok) throw new Error(first.error.code);
  const page = first.value.value as { items: { id: string }[]; nextCursor: string };
  expect(page.items).toHaveLength(50); expect(page.items[0]!.id).toBe(ids.at(-1)); expect(page.nextCursor).toBeTypeOf('string');
  const second = await k.ask('bazaar.listing.list', { cursor: page.nextCursor }, { actor });
  if (!second.ok) throw new Error(second.error.code);
  const tail = second.value.value as { items: { id: string }[]; nextCursor?: string };
  expect(tail.items).toHaveLength(5); expect(tail.nextCursor).toBeUndefined();
  expect(new Set([...page.items, ...tail.items].map(row => row.id))).toEqual(new Set(ids));
  const foreign = await k.ask('bazaar.listing.list', { cursor: page.nextCursor }, { actor: k.user() });
  expect(!foreign.ok || (foreign.value.value as { items: unknown[] }).items.length === 0).toBe(true);
});


it('replays an archive command exactly once and starts a fresh 90-day window only after restoration', async () => {
  const { k, input, actor, cmd } = setup();
  await cmd('bazaar.listing.create', input);
  const key = k.ids.next();
  const data = { listingId: input.listingId, expectedRevision: 1 };
  const archived = await k.cmd('bazaar.listing.archive', data, { actor, idempotencyKey: key });
  if (!archived.ok) throw new Error(archived.error.code);
  const before = [...k.events];
  const replay = await k.cmd('bazaar.listing.archive', data, { actor, idempotencyKey: key });
  expect(replay.ok && replay.value.value).toEqual(archived.value.value); expect(k.events).toEqual(before);
  const first = archived.value.value as { archiveRecordId: string; restoreUntil: string };
  await cmd('bazaar.listing.restore', { archiveRecordId: first.archiveRecordId, expectedRevision: 1 });
  k.clock.advance(86400000);
  const again = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 3 });
  if (!again.ok) throw new Error(again.error.code);
  const second = again.value.value as { archiveRecordId: string; restoreUntil: string };
  expect(second.archiveRecordId).not.toBe(first.archiveRecordId);
  expect(Date.parse(second.restoreUntil) - Date.parse(first.restoreUntil)).toBe(86400000);
  const list = await k.ask('bazaar.archive_record.list_mine', { listingId: input.listingId }, { actor });
  expect(list.ok && (list.value.value as { items: unknown[] }).items).toHaveLength(2);
});

it('uses one clock observation for an archive deadline while the clock advances between reads', async () => {
  const { k, input, actor, cmd } = setup();
  await cmd('bazaar.listing.create', input);
  const now = k.clock.now;
  k.clock.now = () => { const value = now(); k.clock.advance(1); return value; };
  k.clock.iso = () => new Date(k.clock.now()).toISOString();
  const result = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 1 });
  expect(result.ok).toBe(true); if (!result.ok) return;
  const { archiveRecordId } = result.value.value as { archiveRecordId: string };
  const record = await k.ask('bazaar.archive_record.get', { archiveRecordId }, { actor });
  expect(record.ok).toBe(true); if (!record.ok) return;
  const data = (record.value.value as { record: { data: { archivedAt: string; restoreUntil: string } } }).record.data;
  expect(Date.parse(data.restoreUntil) - Date.parse(data.archivedAt)).toBe(90 * 86400000);
});


it('refuses ambiguous active archive records rather than restoring against conflicting evidence', async () => {
  const { k, input, actor, cmd } = setup();
  await cmd('bazaar.listing.create', input);
  const archived = await cmd('bazaar.listing.archive', { listingId: input.listingId, expectedRevision: 1 });
  if (!archived.ok) throw new Error(archived.error.code);
  const { archiveRecordId } = archived.value.value as { archiveRecordId: string };
  const record = await k.storage.read(tx => tx.records.get(k.tenantId, archiveRecordRepo.type, archiveRecordId));
  if (!record) throw new Error('Missing archive record');
  await k.storage.transaction(tx => tx.records.put({ tenant: k.tenantId, type: archiveRecordRepo.type, id: k.ids.next(),
    data: record.data, idx: [identity.principal, input.listingId, 'archived', null], expectedRevision: 0, now: k.clock.now() }));
  const events = [...k.events];
  const restore = await cmd('bazaar.listing.restore', { archiveRecordId, expectedRevision: 1 });
  expect(!restore.ok && restore.error.code).toBe('CONFLICT_STATE'); expect(k.events).toEqual(events);
  const current = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor });
  expect(current.ok && (current.value.value as { data: { status: string } }).data.status).toBe('archived');
});
