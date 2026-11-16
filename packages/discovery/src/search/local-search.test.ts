import { describe, expect, it } from 'vitest';
import { createTestKernel } from '@classrup/kernel/testing';
import { discoveryDefinitions, type PublicListingProjection, type RetainedListing, type VerifiedStatement } from '../index.ts';

const DAY = 86_400_000;
function setup() {
  const k = createTestKernel();
  k.registry.add(...discoveryDefinitions({ verifyEnvelope: async input => input as VerifiedStatement }).all);
  const category = k.ids.next();
  const owner = 'did:key:local-test-author';
  const base = (): PublicListingProjection => ({ listingId: k.ids.next(), ownerId: owner, revision: 1,
    kind: 'sell', title: 'Winter bicycle', description: 'A good winter bicycle.', categoryId: category,
    condition: 'good', tags: [], locale: 'en', regionCell: 'c2b2', barterOptIn: true,
    value: { currency: 'CAD', amount: '9007199254740993' }, availability: 'available', expiresAt: new Date(k.clock.now() + 90 * DAY).toISOString() });
  const retain = async (p: PublicListingProjection, suffix = '') => {
    const result = await k.cmd('discovery.listing.retain', { envelope: { author: p.ownerId, type: 'classrup.bazaar.listing/v1',
      payload: p, cid: `${p.listingId}-${p.revision}${suffix}`, seq: p.revision } });
    expect(result.ok).toBe(true);
  };
  const search = async (input: unknown = {}): Promise<{ items: RetainedListing[]; source: string; staleOrExcluded: number }> => {
    const result = await k.ask('discovery.listing.search', input);
    if (!result.ok) throw new Error(result.error.code);
    return result.value.value as { items: RetainedListing[]; source: string; staleOrExcluded: number };
  };
  return { k, category, owner, base, retain, search };
}

describe('retained search options through the public query', () => {
  it('preserves default result order and existing query/block/availability filtering', async () => {
    const { base, retain, search, owner } = setup();
    const a = base(); const b = { ...base(), availability: 'unavailable' as const };
    await retain(a); await retain(b);
    const original = await search({ includeUnavailable: true });
    expect(await search({ includeUnavailable: true, options: { sort: 'retained' } })).toEqual(original);
    expect((await search()).items.map(r => r.listingId)).toEqual([a.listingId]);
    expect((await search({ query: 'unmatched' })).items).toEqual([]);
    expect((await search({ blockedOwners: [owner], options: { sort: 'ranked' } })).items).toEqual([]);
  });

  it('filters exact category, kind, condition and arbitrary-precision declared price without currency conversion', async () => {
    const { k, base, retain, search, category } = setup();
    const a = base();
    await retain(a);
    await retain({ ...base(), value: { currency: 'CAD', amount: '9007199254740992' } });
    await retain({ ...base(), value: { currency: 'USD', amount: a.value!.amount } });
    await retain({ ...base(), condition: 'poor' });
    await retain({ ...base(), categoryId: k.ids.next() });
    await retain({ ...base(), kind: 'giveaway', value: undefined });
    const result = await search({ options: { categoryId: category, kind: 'sell', condition: 'good',
      price: { currency: 'CAD', min: '9007199254740993', max: '9007199254740993' } } });
    expect(result.items.map(r => r.listingId)).toEqual([a.listingId]);
    expect(result.staleOrExcluded).toBe(5);
  });

  it('uses coarse-cell overlap for radius filters, including less precise published cells', async () => {
    const { base, retain, search } = setup();
    const coarse = { ...base(), regionCell: 'u4pr' };
    const near = { ...base(), regionCell: 'u4pru' };
    await retain(coarse); await retain(near); await retain({ ...base(), regionCell: 's0000' });
    const results = await search({ options: { centerCell: 'u4pru', distanceKm: 5 } });
    expect(results.items.map(r => r.listingId).sort()).toEqual([coarse.listingId, near.listingId].sort());
    expect(JSON.stringify(results)).not.toContain('latitude');
  });

  it('ranks matching records by local recency and optional coarse distance with deterministic ties', async () => {
    const { k, base, retain, search } = setup();
    const far = { ...base(), regionCell: 's0000' };
    const near = { ...base(), regionCell: 'u4pru' };
    await retain(far); await retain(near);
    const nearFirst = await search({ options: { sort: 'ranked', centerCell: 'u4pru' } });
    expect(nearFirst.items.map(r => r.listingId)).toEqual([near.listingId, far.listingId]);
    k.clock.advance(DAY);
    const newer = base(); await retain(newer);
    const input = { query: 'bicycle', options: { sort: 'ranked' } };
    const ranked = await search(input);
    expect(ranked.items[0]?.listingId).toBe(newer.listingId);
    expect(await search(input)).toEqual(ranked);
  });

  it('anchors seenWithinDays and rank recency across signed listing revisions', async () => {
    const { k, base, retain, search } = setup();
    const old = base(); await retain(old);
    const observed = (await search()).items[0]!.observedAt;
    k.clock.advance(8 * DAY);
    const recent = base(); await retain(recent);
    await retain({ ...old, revision: 2, title: 'Edited winter bicycle' });
    const ranked = await search({ options: { sort: 'ranked' } });
    expect(ranked.items.map(r => r.listingId)).toEqual([recent.listingId, old.listingId]);
    expect(ranked.items[1]?.observedAt).toBe(observed);
    expect((await search({ options: { seenWithinDays: 7 } })).items.map(r => r.listingId)).toEqual([recent.listingId]);
  });

  it('rejects missing centers, precise/private locations, invalid prices and unsupported query options', async () => {
    const { k } = setup();
    for (const options of [{ distanceKm: 5 }, { centerCell: 'u4pruy' }, { latitude: 50 }, { distanceKm: 1, centerCell: 'u4pru' },
      { price: { min: '10' } }, { price: { currency: 'CAD', min: '20', max: '10' } },
      { price: { currency: 'CAD', min: '1.5' } }, { sort: 'paid' }, { categoryId: 'unknown' }]) {
      expect((await k.ask('discovery.listing.search', { options })).ok).toBe(false);
    }
    const polar = await k.ask('discovery.listing.search', { options: { centerCell: 'zzzzz', distanceKm: 100 } });
    expect(polar).toMatchObject({ ok: false, error: { code: 'DISCOVERY_RADIUS_TOO_LARGE' } });
  });
});
