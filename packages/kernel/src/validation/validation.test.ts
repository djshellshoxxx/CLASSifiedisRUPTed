import { describe, expect, it } from 'vitest';
import { parseInput } from './parse.ts';
import { boundedString, codePointLength, money, strictObject, timestamp, uuidv7, z } from './schemas.ts';

const fields = (r: { ok: boolean; error?: { fields?: unknown } } | { ok: true }) => ('error' in r ? r.error?.fields : undefined);

describe('validation (CTR-ERR-001, CTR-SCH-001)', () => {
  it('TEST-PS-117-09.T04 strict parsing maps unknown, missing, mistyped and bounded fields to VALIDATION_FAILED fields', () => {
    const schema = strictObject({ title: z.string().max(5), count: z.int().min(1), nested: strictObject({ tags: z.array(z.string()).max(1) }), kind: z.enum(['a', 'b']) });
    const r = parseInput(schema, { title: 'toolong', count: 'x', nested: { tags: ['a', 'b'], extra: 1 }, kind: 'c', zz: true });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error.code).toBe('VALIDATION_FAILED');
    expect(fields(r)).toEqual(
      expect.arrayContaining([
        { path: 'title', code: 'TOO_BIG' },
        { path: 'count', code: 'INVALID_TYPE' },
        { path: 'nested.tags', code: 'TOO_BIG' },
        { path: 'nested.extra', code: 'UNKNOWN_FIELD' },
        { path: 'kind', code: 'INVALID_VALUE' },
        { path: 'zz', code: 'UNKNOWN_FIELD' },
      ]),
    );
    expect(fields(parseInput(schema, { count: 1, nested: { tags: [] }, kind: 'a' }))).toEqual([{ path: 'title', code: 'REQUIRED' }]);
    const okr = parseInput(schema, { title: 'lamp', count: 2, nested: { tags: ['x'] }, kind: 'b' });
    expect(okr.ok && okr.value.title).toBe('lamp');
    expect(!parseInput(schema, undefined).ok).toBe(true);
  });

  it('TEST-PS-117-09.T05 shared validators: uuidv7, RFC 3339 ms timestamps, code-point bounds and Money shape', () => {
    const s = strictObject({ id: uuidv7<'Offer'>(), at: timestamp(), note: boundedString({ max: 3 }), price: money({ sign: 'positive' }) });
    const good = { id: '0192f3a4-5b6c-7d8e-9f01-23456789abcd', at: '2026-11-04T10:15:30.123Z', note: '😀😀😀', price: { amount: '4500', currency: 'EUR' } };
    expect(parseInput(s, good).ok).toBe(true);
    expect(codePointLength('😀😀😀')).toBe(3);
    const bad = parseInput(s, { id: '0192F3A4-5B6C-7D8E-9F01-23456789ABCD', at: '2026-11-04T10:15:30Z', note: '😀😀😀😀', price: { amount: '-1', currency: 'eur' } });
    expect(fields(bad)).toEqual([
      { path: 'id', code: 'INVALID_UUIDV7' },
      { path: 'at', code: 'INVALID_TIMESTAMP' },
      { path: 'note', code: 'TOO_BIG' },
      { path: 'price.amount', code: 'INVALID_SIGN' },
      { path: 'price.currency', code: 'INVALID_CURRENCY' },
    ]);
    expect(fields(parseInput(money(), { amount: '01', currency: 'USDC' }))).toEqual([{ path: 'amount', code: 'INVALID_AMOUNT' }]);
    expect(fields(parseInput(money(), { amount: '1.5', currency: 'BTC', x: 1 }))).toEqual([{ path: 'amount', code: 'INVALID_AMOUNT' }, { path: 'x', code: 'UNKNOWN_FIELD' }]);
    expect(parseInput(money(), { amount: '-250', currency: 'BTC' }).ok).toBe(true);
    expect(parseInput(money({ sign: 'nonNegative' }), { amount: '0', currency: 'ETH' }).ok).toBe(true);
    expect(parseInput(money({ sign: 'positive' }), { amount: '0', currency: 'ETH' }).ok).toBe(false);
    expect(parseInput(timestamp(), '2026-02-30T10:00:00.000Z').ok).toBe(false);
    expect(parseInput(boundedString({ min: 2, max: 4 }), 'a').ok).toBe(false);
  });
});
