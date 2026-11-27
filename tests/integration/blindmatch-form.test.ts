import { describe, expect, it } from 'vitest';
import { privateIntentFormInput } from '../../apps/pwa/src/blindmatch.ts';
import { privateIntentSchema } from '../../packages/blindmatch/src/index.ts';

function form(values: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ query: 'guitar', expires: '2026-12-31T12:34:56', ...values })) if (value !== undefined) data.set(key, value);
  return data;
}

describe('private local intent form', () => {
  it('preserves exact large integer limits and normalizes user text without a numeric conversion', () => {
    const amount = '987654321012345678901234567890123456789';
    expect(privateIntentFormInput(form({ query: 'cafe\u0301', currency: ' cad ', min: amount, max: amount })))
      .toEqual({ criteria: { query: 'café', price: { currency: 'CAD', min: amount, max: amount } }, expiresAt: '2026-12-31T12:34:56.000Z' });
  });

  it('round-trips all available filters and preserves unchanged expiry precision', () => {
    const previous = privateIntentSchema.parse({
      intentId: '12345678-1234-4234-8234-123456789012', ownerId: 'did:key:owner', state: 'active',
      expiresAt: '2026-12-31T12:34:56.789Z',
      criteria: { query: 'guitar', categoryId: '0195aaaa-0000-7000-8000-000000000001', kind: 'sell', condition: 'good',
        regionCell: 'c2b2', price: { currency: 'CAD', min: '0', max: '20000' } },
    });
    const result = privateIntentFormInput(form({ category: previous.criteria.categoryId!, kind: 'sell', condition: 'good',
      region: 'c2b2', currency: 'CAD', min: '0', max: '20000' }), previous);
    expect(result).toEqual({ criteria: previous.criteria, expiresAt: previous.expiresAt });
    expect(privateIntentFormInput(form(), previous).criteria).toEqual({ query: 'guitar' });
  });

  it('preserves unchanged subsecond expiry when a native datetime input omits zero seconds', () => {
    const previous = privateIntentSchema.parse({
      intentId: '12345678-1234-4234-8234-123456789012', ownerId: 'did:key:owner', state: 'draft',
      expiresAt: '2026-12-31T12:34:00.789Z', criteria: { query: 'guitar' },
    });
    expect(privateIntentFormInput(form({ expires: '2026-12-31T12:34' }), previous).expiresAt)
      .toBe(previous.expiresAt);
    expect(privateIntentFormInput(form({ expires: '2026-12-31T12:35' }), previous).expiresAt)
      .toBe('2026-12-31T12:35:00.000Z');
  });

  it.each([
    { min: '1' }, { currency: 'CAD', min: '2', max: '1' }, { currency: 'CAD', min: '-1' },
    { currency: 'CAD', min: '1.5' }, { currency: 'CAD', min: '01' }, { currency: 'CAD', max: '9'.repeat(79) },
    { query: 'private\u0000text' }, { query: 'q'.repeat(121) }, { region: 'c2b2xx' }, { category: 'not-a-category' },
    { expires: '2026-02-30T12:00:00' }, { expires: '' }, { expires: '2026-12-31T12:00:00+01:00' },
  ])('rejects invalid form values before mutation: %j', values => {
    expect(() => privateIntentFormInput(form(values))).toThrow();
  });
});
