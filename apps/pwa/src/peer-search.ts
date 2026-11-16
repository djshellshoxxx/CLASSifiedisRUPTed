import { localSearchOptionsSchema, type LocalSearchOptions } from '../../../packages/discovery/src/index.ts';

export interface PeerSearchInput { readonly query: string; readonly options: LocalSearchOptions; }
export const defaultPeerSearch = (): PeerSearchInput => ({ query: '', options: { sort: 'retained' } });
/** Form values are parsed before replacing the last successfully applied search. No query is persisted. */
export function parsePeerSearch(form: Pick<FormData, 'get'>): PeerSearchInput {
  const field = (key: string): string => {
    const value = form.get(key);
    if (value === null) return '';
    if (typeof value !== 'string') throw new Error('Search fields must be text.');
    return value;
  };
  const query = field('query');
  if (query.length > 120) throw new Error('Search text must be 120 characters or fewer.');
  const kind = field('kind'); const condition = field('condition'); const sort = field('sort') || 'retained';
  const centerCell = field('centerCell').trim(); const radius = field('distanceKm');
  if (radius && !centerCell) throw new Error('Enter a coarse area before choosing a radius.');
  if (radius && !['5', '10', '25', '50', '100'].includes(radius)) throw new Error('Choose one of the available approximate radii.');
  const result = localSearchOptionsSchema.safeParse({ sort, ...(kind ? { kind } : {}), ...(condition ? { condition } : {}),
    ...(centerCell ? { centerCell } : {}), ...(radius ? { distanceKm: Number(radius) } : {}) });
  if (!result.success) throw new Error('Check the search choices and use a lowercase 4–5 character geohash for the coarse area.');
  return { query, options: result.data };
}
