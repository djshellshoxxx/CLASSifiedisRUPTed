import { beforeAll, describe, expect, it } from 'vitest';
import { defineCommand, z } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { createIdentity, type UnlockedIdentity } from '@classrup/identity';
import { signEnvelope, verifyEnvelope } from '@classrup/federation';
import { discoveryDefinitions } from '@classrup/discovery';
import { bazaarDefinitions, releaseSubjectReservations } from './index.ts';

let identity: UnlockedIdentity;
beforeAll(async () => { identity = (await createIdentity('correct horse battery staple')).identity; });
function setup() {
  const k = createTestKernel();
  const categoryId = k.ids.next();
  const actor = { kind: 'user' as const, id: identity.principal, roles: ['member'] };
  const defs = bazaarDefinitions({ categoryAllowed: id => id === categoryId,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(identity, { type, payload, seq, prev, createdAt: new Date(k.clock.now()).toISOString() }) }),
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
});
