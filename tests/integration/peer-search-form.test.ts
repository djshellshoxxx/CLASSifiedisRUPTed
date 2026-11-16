import { describe, expect, it } from 'vitest';
import { defaultPeerSearch, parsePeerSearch } from '../../apps/pwa/src/peer-search.ts';
const form = (fields: Record<string, string>) => { const data = new FormData(); for (const [k, v] of Object.entries(fields)) data.set(k, v); return data; };
describe('peer search form parser', () => {
  it('preserves default search and parses supported choices', () => {
    expect(parsePeerSearch(form({}))).toEqual(defaultPeerSearch());
    expect(parsePeerSearch(form({ query: 'Bicycle', kind: 'sell', condition: 'poor', sort: 'ranked', centerCell: ' u4pru ', distanceKm: '25' })))
      .toEqual({ query: 'Bicycle', options: { kind: 'sell', condition: 'poor', sort: 'ranked', centerCell: 'u4pru', distanceKm: 25 } });
    expect(parsePeerSearch(form({ centerCell: 'c2b2', sort: 'ranked' })).options).toEqual({ centerCell: 'c2b2', sort: 'ranked' });
  });
  it('rejects missing radius center, forbidden precision and unsupported options', () => {
    const cases: Record<string, string>[] = [{ distanceKm: '5' }, { centerCell: 'u4pruy' }, { centerCell: 'U4PRU' }, { kind: 'auction' }, { condition: 'unknown' },
      { sort: 'paid' }, { centerCell: 'u4pru', distanceKm: '0x19' }, { centerCell: 'u4pru', distanceKm: '3' }, { query: 'x'.repeat(121) }];
    for (const data of cases) expect(() => parsePeerSearch(form(data))).toThrow();
  });
  it('does not coerce non-text form data or share mutable defaults', () => {
    expect(() => parsePeerSearch({ get: () => new File(['x'], 'x') })).toThrow('text');
    const a = defaultPeerSearch(); a.options.sort = 'ranked';
    expect(defaultPeerSearch().options.sort).toBe('retained');
  });
});
