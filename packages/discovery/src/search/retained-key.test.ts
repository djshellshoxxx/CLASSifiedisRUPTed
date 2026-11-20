import { describe, expect, it } from 'vitest';
import { retainedListingId } from '../index.ts';

describe('canonical retained listing record key', () => {
  it('preserves the existing owner/listing key representation', () => {
    expect(retainedListingId('did:key:owner-a', '0195aaaa-0000-7000-8000-000000000001'))
      .toBe('did:key:owner-a/0195aaaa-0000-7000-8000-000000000001');
  });

  it('keeps records distinct when the owner or listing differs', () => {
    const listingId = '0195aaaa-0000-7000-8000-000000000001';
    const keys = [
      retainedListingId('did:key:owner-a', listingId),
      retainedListingId('did:key:owner-b', listingId),
      retainedListingId('did:key:owner-a', '0195aaaa-0000-7000-8000-000000000002'),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});
