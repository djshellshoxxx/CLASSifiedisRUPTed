import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkIdSkew, createDeterministicIds, createUuidV7Generator, isUuidV7, parseId, uuidV7Timestamp, type Id } from './uuidv7.ts';

const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('UUIDv7 identifiers (CTR-ID-001)', () => {
  it('TEST-PS-117-09.T01 generated IDs are lowercase canonical v7 with variant 10; parser rejects other forms', () => {
    const gen = createUuidV7Generator({ now: () => Date.parse('2026-11-04T10:15:30.123Z') });
    const id = gen.next();
    expect(id).toMatch(V7);
    expect(uuidV7Timestamp(id)).toBe(Date.parse('2026-11-04T10:15:30.123Z'));
    expect(isUuidV7(id)).toBe(true);
    for (const bad of [id.toUpperCase(), `{${id}}`, '0192f3a4-5b6c-4d8e-9f01-23456789abcd', '0192f3a4-5b6c-7d8e-cf01-23456789abcd', id.replace(/-/g, ''), '', 42]) {
      expect(isUuidV7(bad)).toBe(false);
      const r = parseId(bad, 'listingId');
      expect(!r.ok && r.error.fields).toEqual([{ path: 'listingId', code: 'INVALID_UUIDV7' }]);
    }
    expect(parseId(id).ok).toBe(true);
    expect(createUuidV7Generator().next()).toMatch(V7);
  });

  it('TEST-PS-117-09.T02 property: IDs are unique and strictly increasing per generator, including same-ms bursts and clock regressions', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 1, maxLength: 300 }), fc.integer({ min: 1, max: 2 ** 31 }), (steps, seed) => {
        let now = Date.parse('2026-11-04T10:00:00.000Z');
        const gen = createDeterministicIds({ seed, now: () => now });
        const out: string[] = [];
        for (const s of steps) {
          now += s;
          out.push(gen.next());
        }
        for (let i = 1; i < out.length; i++) expect((out[i - 1] ?? '') < (out[i] ?? '')).toBe(true);
        expect(new Set(out).size).toBe(out.length);
        expect(out.every((x) => V7.test(x))).toBe(true);
      }),
      { numRuns: 200 },
    );
    const gen = createUuidV7Generator({ now: () => 1_700_000_000_000 });
    const burst = Array.from({ length: 100_000 }, () => gen.next());
    expect(new Set(burst).size).toBe(burst.length);
    expect([...burst].sort()).toEqual(burst);
  });

  it('TEST-PS-117-09.T03 IDs more than 24 h ahead of the receiver clock are rejected with ID_TIMESTAMP_SKEW', () => {
    const now = Date.parse('2026-11-04T10:00:00.000Z');
    const at = (ms: number): Id => createUuidV7Generator({ now: () => ms }).next();
    expect(checkIdSkew(at(now + 24 * 3600_000), now).ok).toBe(true);
    const r = checkIdSkew(at(now + 24 * 3600_000 + 1), now);
    expect(!r.ok && r.error).toMatchObject({ code: 'ID_TIMESTAMP_SKEW', status: 422, retryable: false });
    expect(checkIdSkew(at(now - 365 * 24 * 3600_000), now).ok).toBe(true);
  });
});
