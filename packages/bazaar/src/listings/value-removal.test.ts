import { beforeAll, describe, expect, it } from 'vitest';
import { defineCommand, z, type StoredRecord } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { createIdentity, type UnlockedIdentity } from '@classrup/identity';
import { signEnvelope, verifyEnvelope } from '@classrup/federation';
import { discoveryDefinitions } from '@classrup/discovery';
import { bazaarDefinitions, inventoryHoldRepo, validateListingRevision, type Listing, type ListingRevision } from './index.ts';

let identity: UnlockedIdentity;
beforeAll(async () => { identity = (await createIdentity('correct horse battery staple')).identity; });

async function setup(kind: Listing['kind'] = 'giveaway', value = { amount: '900719925474099301', currency: 'EUR' }) {
  const k = createTestKernel();
  const actor = { kind: 'user' as const, id: identity.principal, roles: ['member'] };
  const verify = (envelope: unknown) => verifyEnvelope(envelope, { now: k.clock.now() });
  k.registry.add(...bazaarDefinitions({ categoryAllowed: () => true,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(identity, {
      type, payload, seq, prev, createdAt: k.clock.iso(),
    }) }), verifyProjection: verify,
  }).all, ...discoveryDefinitions({ verifyEnvelope: verify }).all);
  const input = { listingId: k.ids.next(), kind, title: 'Valued local guitar', description: 'An exact optional declared value.',
    categoryId: k.ids.next(), condition: 'good' as const, regionCell: 'c2b2', barterOptIn: true,
    value, privateNotes: 'owner-only-note', tags: ['Music'], locale: 'fr-CA' };
  const cmd = (name: string, data: unknown) => k.cmd(name, data, { actor });
  expect((await cmd('bazaar.listing.create', input)).ok).toBe(true);
  const { kind: _kind, value: _value, ...editFields } = input;
  const edit = (patch: Record<string, unknown>, expectedRevision: number) => cmd('bazaar.listing.edit', { ...editFields, expectedRevision, ...patch });
  const listing = async () => {
    const result = await k.ask('bazaar.listing.get', { listingId: input.listingId }, { actor });
    if (!result.ok) throw new Error(result.error.code);
    return result.value.value as StoredRecord<Listing>;
  };
  const publish = async (expectedRevision: number) => {
    const result = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision });
    if (!result.ok) throw new Error(result.error.code);
    return (result.value.value as { envelope: unknown }).envelope;
  };
  return { k, actor, input, cmd, edit, editFields, listing, publish, verify };
}

describe('explicit local declared-value removal', () => {
  it('removes a draft value without changing ownership, status, inventory or private fields; replay is idempotent', async () => {
    const { k, actor, input, editFields, listing } = await setup();
    const key = k.ids.next();
    const data = { ...editFields, expectedRevision: 1, removeValue: true };
    const result = await k.cmd('bazaar.listing.edit', data, { actor, idempotencyKey: key });
    expect(result.ok).toBe(true);
    const after = await listing();
    expect(after.revision).toBe(2);
    expect(after.data).not.toHaveProperty('value');
    expect(after.data).toMatchObject({ ownerId: actor.id, status: 'draft', onHand: 1, privateNotes: input.privateNotes,
      title: input.title, categoryId: input.categoryId, tags: input.tags, locale: input.locale });
    expect(after.data).not.toHaveProperty('removeValue');
    const events = [...k.events];
    const replay = await k.cmd('bazaar.listing.edit', data, { actor, idempotencyKey: key });
    expect(replay.ok && replay.value.value).toEqual(result.ok && result.value.value);
    expect(await listing()).toEqual(after);
    expect(k.events).toEqual(events);
    const history = await k.ask('bazaar.listing_revision.list', { listingId: input.listingId }, { actor });
    expect(history.ok && history.value.value).toMatchObject({ items: [] });
  });

  it.each([{ amount: '0', currency: 'JPY' }, { amount: '900719925474099301', currency: 'EUR' }])(
    'preserves exact $currency $amount when value is omitted, undefined or removal is false', async value => {
      const { edit, listing } = await setup('giveaway', value);
      expect((await edit({ title: 'An ordinary edit' }, 1)).ok).toBe(true);
      expect((await listing()).data.value).toEqual(value);
      expect((await edit({ value: undefined }, 2)).ok).toBe(true);
      expect((await listing()).data.value).toEqual(value);
      expect((await edit({ removeValue: false }, 3)).ok).toBe(true);
      expect((await listing()).data.value).toEqual(value);
    },
  );

  it('rejects simultaneous removal and replacement without events or record changes', async () => {
    const { k, edit, listing } = await setup();
    const before = await listing(); const events = [...k.events];
    const result = await edit({ removeValue: true, value: { amount: '0', currency: 'EUR' } }, 1);
    expect(!result.ok && result.error.code).toBe('VALIDATION_FAILED');
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
  });

  it('keeps sell publication blocked after removal until an exact replacement is supplied', async () => {
    const { k, input, cmd, edit, listing, publish, verify } = await setup('sell');
    expect((await edit({ removeValue: true }, 1)).ok).toBe(true);
    const before = await listing(); const events = [...k.events];
    const rejected = await cmd('bazaar.listing.publish', { listingId: input.listingId, expectedRevision: 2 });
    expect(!rejected.ok && rejected.error.code).toBe('VALIDATION_FAILED');
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
    expect((await edit({ value: { amount: '0', currency: 'EUR' } }, 2)).ok).toBe(true);
    const signed = await verify(await publish(3));
    expect(signed.payload).toHaveProperty('value', { amount: '0', currency: 'EUR' });
  });

  it.each(['giveaway', 'wanted'] as const)('records material removal and republishes %s without a value', async kind => {
    const { k, actor, input, cmd, edit, publish, verify } = await setup(kind);
    const original = await publish(1);
    expect((await cmd('discovery.listing.retain', { envelope: original })).ok).toBe(true);
    const withdrawn = await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 });
    if (!withdrawn.ok) throw new Error(withdrawn.error.code);
    const withdrawal = (withdrawn.value.value as { envelope: unknown }).envelope;
    expect((await cmd('discovery.listing.retain', { envelope: withdrawal })).ok).toBe(true);
    expect((await edit({ removeValue: true }, 3)).ok).toBe(true);
    const history = await k.ask('bazaar.listing_revision.get', { listingId: input.listingId, revisionNo: 4 }, { actor });
    if (!history.ok) throw new Error(history.error.code);
    const revision = (history.value.value as { revision: StoredRecord<ListingRevision> }).revision.data;
    expect(revision).toMatchObject({ material: true, changedFields: ['value'], wasPublic: false, source: 'owner_edit' });
    expect(revision.snapshot).not.toHaveProperty('value');
    await expect(validateListingRevision(revision)).resolves.toBeUndefined();
    const change = k.events.find(event => event.type === 'bazaar.listing.edited');
    expect(change?.payload).toMatchObject({ material: true, changedFields: ['value'] });
    expect(JSON.stringify(change)).not.toContain(input.value.amount);
    const replacement = await publish(4);
    const signed = await verify(replacement);
    expect(signed).toMatchObject({ seq: 3, prev: (await verify(withdrawal)).cid });
    expect(signed.payload).not.toHaveProperty('value');
    expect((await verify(original)).payload).toHaveProperty('value', input.value);
    expect((await cmd('discovery.listing.retain', { envelope: replacement })).ok).toBe(true);
    const search = await k.ask('discovery.listing.search', {}, { actor });
    expect(search.ok && search.value.value).toMatchObject({ items: [{ projection: { listingId: input.listingId } }] });
    if (search.ok) expect((search.value.value as { items: Array<{ projection: unknown }> }).items[0]!.projection).not.toHaveProperty('value');
  });

  it('refuses stale, foreign and published removal without mutating any listing or event', async () => {
    const { k, edit, editFields, listing, publish } = await setup();
    const before = await listing(); const events = [...k.events];
    const stale = await edit({ removeValue: true }, 2);
    expect(!stale.ok && stale.error.code).toBe('CONFLICT_REVISION');
    const foreign = await k.cmd('bazaar.listing.edit', { ...editFields, expectedRevision: 1, removeValue: true }, { actor: k.user() });
    expect(!foreign.ok && foreign.error.code).toBe('NOT_FOUND');
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
    await publish(1);
    const published = await listing(); const publishedEvents = [...k.events];
    const blocked = await edit({ removeValue: true }, 2);
    expect(!blocked.ok && blocked.error.code).toBe('CONFLICT_STATE');
    expect(await listing()).toEqual(published); expect(k.events).toEqual(publishedEvents);
  });

  it('requires releasing a live reservation before unpublishing and removing its declared value', async () => {
    const { k, input, cmd, edit, listing, publish } = await setup();
    await publish(1);
    const holdId = k.ids.next();
    expect((await cmd('bazaar.inventory.reserve', { listingId: input.listingId, expectedRevision: 2, holdId,
      subjectId: k.ids.next(), revisionHash: 'immutable-proposal-hash', expiresAt: new Date(k.clock.now() + 10000).toISOString() })).ok).toBe(true);
    const before = await listing(); const events = [...k.events];
    expect((await edit({ removeValue: true }, 2)).ok).toBe(false);
    expect((await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 })).ok).toBe(false);
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
    expect((await k.storage.read(tx => tx.records.get(k.tenantId, inventoryHoldRepo.type, holdId)))?.data).toMatchObject({ state: 'active' });
    expect((await cmd('bazaar.inventory.release', { holdId, expectedRevision: 1 })).ok).toBe(true);
    expect((await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 })).ok).toBe(true);
    expect((await edit({ removeValue: true }, 3)).ok).toBe(true);
    expect((await listing()).data).not.toHaveProperty('value');
  });

  it('fails closed if a restored draft still has an active hold, then permits removal after expiry', async () => {
    const { k, input, cmd, edit, listing } = await setup();
    const holdId = k.ids.next(); const subjectId = k.ids.next();
    k.registry.add(defineCommand({ name: 'test.hold.seed', module: 'F01', capability: 'test.hold.seed', idempotent: false,
      input: z.strictObject({}), handler: ctx => ctx.tx.repo(inventoryHoldRepo).put(holdId, {
        listingId: input.listingId, ownerId: identity.principal, subjectId, revisionHash: 'immutable-proposal-hash',
        expiresAt: new Date(k.clock.now() + 1000).toISOString(), state: 'active',
      }, { expectedRevision: 0 }) }));
    expect((await cmd('test.hold.seed', {})).ok).toBe(true);
    const before = await listing(); const events = [...k.events];
    const blocked = await edit({ removeValue: true }, 1);
    expect(!blocked.ok && blocked.error.code).toBe('CONFLICT_STATE');
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
    k.clock.advance(1000);
    expect((await edit({ removeValue: true }, 1)).ok).toBe(true);
  });

  it('rolls back removal when its required history entry exceeds the existing edit limit', async () => {
    const { k, input, cmd, edit, listing, publish } = await setup();
    await publish(1);
    expect((await cmd('bazaar.listing.unpublish', { listingId: input.listingId, expectedRevision: 2 })).ok).toBe(true);
    for (let index = 0; index < 20; index++) expect((await edit({ title: `Revised guitar ${index}` }, 3 + index)).ok).toBe(true);
    const before = await listing(); const events = [...k.events];
    const blocked = await edit({ title: before.data.title, removeValue: true }, 23);
    expect(!blocked.ok && blocked.error.code).toBe('RATE_LIMITED');
    expect(await listing()).toEqual(before); expect(k.events).toEqual(events);
    expect(before.data.value).toEqual(input.value);
  });
});
