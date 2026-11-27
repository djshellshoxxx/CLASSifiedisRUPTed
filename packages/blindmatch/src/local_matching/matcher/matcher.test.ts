import { describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { publicListingSchema, type RetainedListing } from '@classrup/discovery';
import { matchLocalCandidates } from './index.ts';

const NOW = Date.UTC(2026, 10, 26);
const OWNER = 'did:key:local-owner';
const id = (n: number) => `0195aaaa-0000-7000-8000-${String(n).padStart(12, '0')}`;

/** Synthetic verified-adapter outputs; this fixture does not perform signature verification. */
function listing(n: number, amount = String(n * 100)): RetainedListing {
  const projection = publicListingSchema.parse({
    listingId: id(n), ownerId: `did:key:peer-${n}`, revision: 1,
    kind: 'sell', title: `Bicycle ${n}`, description: 'A public bicycle description.',
    categoryId: id(999), condition: 'good', tags: ['bicycle'], locale: 'en',
    regionCell: 'u4pru', barterOptIn: false, availability: 'available',
    value: { amount, currency: 'CAD' }, expiresAt: new Date(NOW + 60000).toISOString(),
  });
  return { ownerId: projection.ownerId, listingId: projection.listingId, remoteRevision: 1,
    cid: `public-cid-${n}`, envelopes: [{ syntheticFixture: true }], projection,
    observedAt: new Date(NOW - 1000).toISOString(), conflicted: false, evidenceCids: [`public-cid-${n}`] };
}
const options = { ownerId: OWNER, now: NOW };
const refs = (rows: readonly RetainedListing[]) => rows.map(r => ({ ownerId: r.ownerId, listingId: r.listingId, revision: r.remoteRevision, cid: r.cid }));

describe('bounded local BlindMatch suggestions over verified public candidates', () => {
  it('applies all hard constraints and returns only minimal public references', () => {
    const first = listing(1), second = listing(2), third = listing(3);
    second.projection!.condition = 'fair'; third.projection!.regionCell = 'ezs42';
    const result = matchLocalCandidates({ query: 'BICYCLE', categoryId: id(999), kind: 'sell', condition: 'good',
      regionCell: 'u4pr', price: { currency: 'CAD', min: '100', max: '300' } }, [third, second, first], options);
    expect(result).toEqual({ ok: true, value: refs([first]) });
    expect(matchLocalCandidates({ regionCell: 'u4pru' }, [first], options)).toEqual({ ok: true, value: refs([first]) });
    expect(matchLocalCandidates({ categoryId: id(998) }, [first], options)).toEqual({ ok: true, value: [] });
    expect(matchLocalCandidates({ kind: 'wanted' }, [first], options)).toEqual({ ok: true, value: [] });
  });

  it('skips unavailable, expired, tombstoned, conflicted, blocked and own listings', () => {
    const rows = Array.from({ length: 7 }, (_, i) => listing(i + 1));
    rows[0]!.projection!.availability = 'unavailable';
    rows[1]!.projection!.expiresAt = new Date(NOW).toISOString(); rows[2]!.projection = null;
    rows[3]!.conflicted = true; rows[3]!.evidenceCids.push('public-conflict'); rows[3]!.envelopes.push({ syntheticFixture: true });
    rows[5]!.ownerId = OWNER; rows[5]!.projection!.ownerId = OWNER;
    expect(matchLocalCandidates({}, rows, { ...options, blockedOwners: [rows[4]!.ownerId] }))
      .toEqual({ ok: true, value: refs([rows[6]!]) });
  });

  it('uses inclusive exact minor units including zero and large integers, with no FX', () => {
    for (const amount of ['0', '9007199254740993', '9'.repeat(78)]) {
      const row = listing(1, amount);
      expect(matchLocalCandidates({ price: { currency: 'CAD', min: amount, max: amount } }, [row], options)).toEqual({ ok: true, value: refs([row]) });
      expect(matchLocalCandidates({ price: { currency: 'USD', min: amount, max: amount } }, [row], options)).toEqual({ ok: true, value: [] });
    }
    const row = listing(1, '9007199254740993');
    expect(matchLocalCandidates({ price: { currency: 'CAD', max: '9007199254740992' } }, [row], options)).toEqual({ ok: true, value: [] });
    row.projection!.kind = 'giveaway'; delete row.projection!.value;
    expect(matchLocalCandidates({ price: { currency: 'CAD', max: '1' } }, [row], options)).toEqual({ ok: true, value: [] });
    expect(matchLocalCandidates({}, [row], options)).toEqual({ ok: true, value: refs([row]) });
  });
  it('rejects malformed criteria, unsafe clocks, malformed rows and ambiguous retained identities', () => {
    const malformed: unknown[] = [null, [], { query: 'x'.repeat(121) }, { query: 'private\u0000query' },
      { unknown: true }, { regionCell: 'u4pruy' }, { price: { currency: 'cad' } },
      ...['-1', '01', '1.5', '1e3', '9'.repeat(79)].map(min => ({ price: { currency: 'CAD', min } })),
      { price: { currency: 'CAD', min: '11', max: '10' } }];
    for (const criteria of malformed) expect(matchLocalCandidates(criteria, [listing(1)], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    for (const now of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER]) {
      expect(matchLocalCandidates({}, [], { ...options, now })).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    }
    const row = listing(1);
    for (const changed of [
      { ...row, extra: true }, { ...row, remoteRevision: Number.MAX_SAFE_INTEGER + 1 },
      { ...row, projection: { ...row.projection, ownerId: 'did:key:somebody-else' } },
      { ...row, projection: { ...row.projection, revision: 2 } },
      { ...row, projection: { ...row.projection, listingId: id(2) } },
      { ...row, projection: { ...row.projection, value: { amount: '-1', currency: 'CAD' } } },
      { ...row, evidenceCids: ['another-cid'] }, { ...row, envelopes: [] },
    ]) expect(matchLocalCandidates({}, [changed], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(matchLocalCandidates({}, [row, row], options)).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    const revision2 = { ...row, remoteRevision: 2, projection: { ...row.projection!, revision: 2 } };
    expect(matchLocalCandidates({}, [revision2, row], options)).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
    expect(matchLocalCandidates({}, [row, revision2], options)).toMatchObject({ ok: false, error: { code: 'CONFLICT_REVISION' } });
  });

  it('rejects overflow instead of truncating, and cancelled work publishes no partial results', () => {
    const rows = Array.from({ length: 128 }, (_, i) => listing(i + 1));
    const accepted = matchLocalCandidates({}, rows, options);
    expect(accepted.ok && accepted.value.length).toBe(128);
    expect(matchLocalCandidates({}, [...rows, listing(129)], options)).toMatchObject({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
    const controller = new AbortController(); controller.abort('private cancel reason');
    expect(matchLocalCandidates({}, rows, { ...options, signal: controller.signal })).toMatchObject({ ok: false, error: { code: 'PRECONDITION_FAILED' } });
  });

  it('matches an independent interval oracle across deterministic small cases and permutations', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 30 }), fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30 }),
      (size, a, b) => {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        const rows = Array.from({ length: size }, (_, i) => listing(i + 1, String(i + 1)));
        // Amount equals ordinal: expected indices follow interval arithmetic, independent of the matcher.
        const wanted = new Set(Array.from({ length: Math.max(0, Math.min(size, hi) - Math.max(1, lo) + 1) }, (_, i) => Math.max(1, lo) + i));
        const expected = refs(rows.filter((_, i) => wanted.has(i + 1))).sort((x, y) => x.ownerId < y.ownerId ? -1 : x.ownerId > y.ownerId ? 1 : 0);
        const criteria = { price: { currency: 'CAD', min: String(lo), max: String(hi) } };
        expect(matchLocalCandidates(criteria, rows, options)).toEqual({ ok: true, value: expected });
        expect(matchLocalCandidates(criteria, [...rows].reverse(), options)).toEqual({ ok: true, value: expected });
      }), { seed: 261126, numRuns: 80 });
  });

  it('does not mutate inputs, expose criteria/amounts/reasons, or call network and logging APIs', () => {
    const row = listing(1, '314159265358979323846');
    const criteria = { query: 'Bicycle', price: { currency: 'CAD', max: '314159265358979323847' } };
    const before = JSON.stringify({ row, criteria });
    const network = vi.spyOn(globalThis, 'fetch');
    const log = vi.spyOn(console, 'log'), warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    try {
      const result = matchLocalCandidates(criteria, [row], options);
      expect(result).toEqual({ ok: true, value: refs([row]) });
      expect(JSON.stringify(result)).not.toMatch(/Bicycle|31415926535897932384|score|reason|query|price/);
      expect(JSON.stringify({ row, criteria })).toBe(before);
      expect(network).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    } finally { network.mockRestore(); log.mockRestore(); warn.mockRestore(); error.mockRestore(); }
  });

  it('admits only dense data arrays and closed data objects without invoking accessors', () => {
    let reads = 0;
    const accessor = Object.defineProperty({}, 'query', { enumerable: true, get() { reads++; return 'private'; } });
    expect(matchLocalCandidates(accessor, [], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    const candidate = Object.defineProperty({ ...listing(1) }, 'projection', { enumerable: true, get() { reads++; return null; } });
    expect(matchLocalCandidates({}, [candidate], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(reads).toBe(0);
    expect(matchLocalCandidates({}, Array(128), options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    const oversizedEvidence = { ...listing(1), envelopes: Array(10000) };
    expect(matchLocalCandidates({}, [oversizedEvidence], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    const oversizedText = { ...listing(1), projection: { ...listing(1).projection, description: 'x'.repeat(10001) } };
    expect(matchLocalCandidates({}, [oversizedText], options)).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
    expect(matchLocalCandidates({}, [], { ...options, blockedOwners: Array(2001).fill('did:key:blocked') })).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('uses code-point owner order then listing identity, independent of locale and arrival order', () => {
    const first = listing(3), second = listing(2), third = listing(1);
    first.ownerId = first.projection!.ownerId = 'did:key:\u{10000}';
    second.ownerId = second.projection!.ownerId = 'did:key:\ue000';
    third.ownerId = third.projection!.ownerId = second.ownerId;
    expect(matchLocalCandidates({}, [first, second, third], options)).toEqual({ ok: true, value: refs([third, second, first]) });
  });
});
