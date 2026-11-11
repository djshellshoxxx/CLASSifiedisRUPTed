import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { err, ok, appError, type AppError, type Result } from '@classrup/kernel';
import { cellsForRadius } from '../../geoprivacy/coarse/index.ts';
import * as mod from './index.ts';
import { canonicalize, compileFilter, discoveryFilterErrors, filterCacheKey, validateFilter, type Filter, type FilterPorts, type ValidatedFilter } from './index.ts';

const NOW = Date.parse('2026-11-04T10:00:00Z');
const cat = (n: number) => `00000000-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;
// 20 categories; category 0 has children 1..3, category 1 has child 4.
const TREE: Record<number, number[]> = { 0: [0, 1, 2, 3, 4], 1: [1, 4] };
const CURRENCIES = ['EUR', 'USD', 'CAD'];
function ports(over: Partial<{ categories: FilterPorts['categories']; currencies: FilterPorts['currencies']; homeCell: string }> = {}): FilterPorts {
  return {
    categories: over.categories ?? { expand: id => { const n = Number.parseInt(id.slice(-12), 16); return n >= 0 && n < 20 ? ok((TREE[n] ?? [n]).map(cat)) : ok(null); }, snapshotAgeMs: () => 0 },
    currencies: over.currencies ?? { isRegistered: c => ok(CURRENCIES.includes(c)) },
    ...(over.homeCell ? { homeCell: () => over.homeCell } : {}),
  };
}
const good = (input: unknown, p: FilterPorts = ports()): ValidatedFilter => { const r = validateFilter(input, p); if (!r.ok) throw new Error(JSON.stringify(r.error)); return r.value; };
const bad = (input: unknown, p: FilterPorts = ports()): AppError => { const r = validateFilter(input, p); if (r.ok) throw new Error('expected error'); return r.error; };
const compiled = (v: ValidatedFilter, now = NOW) => { const r = compileFilter(v, now); if (!r.ok) throw new Error(JSON.stringify(r.error)); return r.value; };

const FULL: Filter = { categoryIds: [cat(1)], listingKinds: ['sell', 'auction'], price: { currency: 'EUR', min: 100, max: 30000 }, conditions: ['good', 'new'], distanceKm: 10, centerCell: 'u4pru', barterAcceptable: true, postedWithin: '7d' };

describe('PS-044 search filters', () => {
  it('TEST-PS-044-09.T01 a filter with every key valid validates and its canonical form equals the golden', () => {
    const v = good(FULL);
    expect(v.filter).toEqual({
      barterAcceptable: true, categoryIds: [cat(1)], centerCell: 'u4pru', conditions: ['good', 'new'], distanceKm: 10,
      listingKinds: ['auction', 'sell'], postedWithin: '7d', price: { currency: 'EUR', min: 100, max: 30000 },
    });
    expect(Object.keys(v.filter)).toEqual(['barterAcceptable', 'categoryIds', 'centerCell', 'conditions', 'distanceKm', 'listingKinds', 'postedWithin', 'price']);
    expect(filterCacheKey(FULL)).toBe('{"barterAcceptable":true,"categoryIds":["00000000-0000-7000-8000-000000000001"],"centerCell":"u4pru","conditions":["good","new"],"distanceKm":10,"listingKinds":["auction","sell"],"postedWithin":"7d","price":{"currency":"EUR","max":30000,"min":100}}');
    expect(v.categoryIds).toEqual([cat(1), cat(4)]); // descendants expanded, sorted
    expect(v.hints.categoriesMayBeOutOfDate).toBe(false);
    expect(good({}).filter).toEqual({});
    expect(good({ price: { currency: 'USD', min: '5', max: '10' } }).filter.price).toEqual({ currency: 'USD', min: 5, max: 10 });
  });

  it('TEST-PS-044-09.T02 price without currency, min above max, distance without center and distance 3 km give the documented code and path', () => {
    const cases: [unknown, string, string, FilterPorts?][] = [
      [{ price: { max: 100 } }, 'DISCOVERY_FILTER_CURRENCY_REQUIRED', 'price.currency'],
      [{ price: { currency: 'XXX', max: 100 } }, 'DISCOVERY_FILTER_CURRENCY_REQUIRED', 'price.currency'],
      [{ price: { currency: 'EUR', min: 500, max: 100 } }, 'DISCOVERY_FILTER_INVALID', 'price.min'],
      [{ price: { currency: 'EUR', max: 1_000_000_000_001 } }, 'DISCOVERY_FILTER_INVALID', 'price.max'],
      [{ price: { currency: 'EUR', min: 1.5 } }, 'DISCOVERY_FILTER_INVALID', 'price.min'],
      [{ price: { currency: 'EUR', min: -1 } }, 'DISCOVERY_FILTER_INVALID', 'price.min'],
      [{ distanceKm: 10 }, 'DISCOVERY_FILTER_CENTER_REQUIRED', 'centerCell'],
      [{ distanceKm: 10, centerCell: 'u4pr' }, 'DISCOVERY_FILTER_CENTER_REQUIRED', 'centerCell'],
      [{ distanceKm: 10, centerCell: 'u4pruy' }, 'DISCOVERY_FILTER_CENTER_REQUIRED', 'centerCell'],
      [{ distanceKm: 3, centerCell: 'u4pru' }, 'DISCOVERY_RADIUS_TOO_SMALL', 'distanceKm'],
      [{ distanceKm: 7 }, 'DISCOVERY_RADIUS_TOO_SMALL', 'distanceKm'],
      [{ centerCell: 'u4pru' }, 'DISCOVERY_FILTER_INVALID', 'centerCell'],
      [{ postedWithin: '1h' }, 'DISCOVERY_FILTER_INVALID', 'postedWithin'],
      [{ conditions: ['poor'] }, 'DISCOVERY_FILTER_INVALID', 'conditions[0]'],
      [{ conditions: [] }, 'DISCOVERY_FILTER_INVALID', 'conditions'],
      [{ listingKinds: ['sell', 'x'] }, 'DISCOVERY_FILTER_INVALID', 'listingKinds[1]'],
      [{ barterAcceptable: 'yes' }, 'DISCOVERY_FILTER_INVALID', 'barterAcceptable'],
      [{ categoryIds: Array.from({ length: 11 }, (_, i) => cat(i)) }, 'DISCOVERY_FILTER_INVALID', 'categoryIds'],
      [{ categoryIds: [cat(99)] }, 'DISCOVERY_FILTER_INVALID', 'categoryIds[0]'],
      [{ categoryIds: ['not-a-uuid'] }, 'DISCOVERY_FILTER_INVALID', 'categoryIds[0]'],
      [{ isAdmin: true }, 'DISCOVERY_FILTER_INVALID', 'isAdmin'],
      [[], 'DISCOVERY_FILTER_INVALID', ''],
      [null, 'DISCOVERY_FILTER_INVALID', ''],
    ];
    for (const [input, code, path, p] of cases) {
      const r = validateFilter(input, p ?? ports());
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      expect([r.error.code, r.error.fields?.[0]?.path]).toEqual([code, path]);
      expect(r.error.status).toBe(422);
    }
    // a stored home cell serves as the centre
    expect(good({ distanceKm: 10 }, ports({ homeCell: 'u4pru' })).filter.centerCell).toBe('u4pru');
    expect(bad({ distanceKm: 10 }, ports({ homeCell: 'u4pr' })).code).toBe('DISCOVERY_FILTER_CENTER_REQUIRED');
  });

  it('TEST-PS-044-09.T03 random key order and equivalent values canonicalize to identical bytes and cache keys', () => {
    const shuffleKeys = (o: Record<string, unknown>, seed: number) => Object.fromEntries(Object.entries(o).sort((a, b) => ((a[0].charCodeAt(0) * seed) % 7) - ((b[0].charCodeAt(0) * seed) % 7)));
    fc.assert(fc.property(fc.integer({ min: 1, max: 50 }), fc.constantFrom(...mod.LISTING_KINDS), fc.constantFrom(...mod.CONDITIONS), fc.boolean(), (seed, kind, cond, dup) => {
      const a = { listingKinds: dup ? [kind, kind] : [kind], conditions: [cond, 'new'], price: { currency: 'EUR', max: 500, min: 10 }, barterAcceptable: false, postedWithin: '24h' };
      const b = shuffleKeys({ ...a, listingKinds: [kind], conditions: ['new', cond], price: shuffleKeys({ min: '10', max: 500, currency: 'EUR' }, seed) }, seed);
      expect(JSON.stringify(canonicalize(a as Filter))).toBe(JSON.stringify(canonicalize(b as unknown as Filter)));
      expect(filterCacheKey(a as Filter)).toBe(filterCacheKey(b as unknown as Filter));
      expect(JSON.stringify(good(a).filter)).toBe(JSON.stringify(good(b).filter));
      expect(JSON.stringify(canonicalize(canonicalize(a as Filter)))).toBe(JSON.stringify(canonicalize(a as Filter)));
    }), { numRuns: 200 });
    expect(filterCacheKey({ listingKinds: ['sell'] })).not.toBe(filterCacheKey({ listingKinds: ['wanted'] }));
  });

  it('TEST-PS-044-09.T04 each key alone and all keys together compile to the golden SQL and parameter order', () => {
    const golden: [Filter, string, unknown[]][] = [
      [{}, '1 = 1', []],
      [{ categoryIds: [cat(1)] }, 'd.category_id IN (?,?)', [cat(1), cat(4)]],
      [{ listingKinds: ['sell'] }, 'd.listing_kind IN (?)', ['sell']],
      [{ price: { currency: 'EUR' } }, 'd.currency = ?', ['EUR']],
      [{ price: { currency: 'EUR', min: 5 } }, 'd.currency = ? AND d.price_minor >= ?', ['EUR', 5]],
      [{ price: { currency: 'EUR', max: 30000 } }, 'd.currency = ? AND d.price_minor <= ?', ['EUR', 30000]],
      [{ conditions: ['new', 'good'] }, 'd.condition IN (?,?)', ['good', 'new']],
      [{ barterAcceptable: true }, 'd.barter = ?', [1]],
      [{ barterAcceptable: false }, 'd.barter = ?', [0]],
      [{ postedWithin: '24h' }, 'd.first_seen_at >= ?', ['2026-11-03T10:00:00.000Z']],
      [{ postedWithin: '7d' }, 'd.first_seen_at >= ?', ['2026-10-28T10:00:00.000Z']],
      [{ postedWithin: '30d' }, 'd.first_seen_at >= ?', ['2026-10-05T10:00:00.000Z']],
    ];
    for (const [f, sql, params] of golden) expect(compiled(good(f))).toEqual({ sql, params });
    const dist = good({ distanceKm: 10, centerCell: 'u4pru' });
    const c = compiled(dist);
    expect(c.sql).toBe(`d.geo_cell5 IN (${dist.cells.map(() => '?').join(',')})`);
    expect(c.params).toEqual(dist.cells); expect(dist.cells).toContain('u4pru');
    const wide = good({ distanceKm: 50, centerCell: 'u4pru' });
    const cw = compiled(wide);
    expect(cw.sql).toBe(`(${wide.cells.map(() => 'd.geo_cell5 BETWEEN ? AND ?').join(' OR ')})`);
    expect(cw.params.slice(0, 2)).toEqual([`${wide.cells[0]}0`, `${wide.cells[0]}z`]);
    const all = good({ ...FULL, categoryIds: [cat(2)] });
    expect(compiled(all).sql).toBe(`d.category_id IN (?) AND d.listing_kind IN (?,?) AND d.currency = ? AND d.price_minor >= ? AND d.price_minor <= ? AND d.condition IN (?,?) AND d.geo_cell5 IN (${all.cells.map(() => '?').join(',')}) AND d.barter = ? AND d.first_seen_at >= ?`);
    expect(compiled(all).params).toEqual([cat(2), 'auction', 'sell', 'EUR', 100, 30000, 'good', 'new', ...all.cells, 1, '2026-10-28T10:00:00.000Z']);
    expect(compileFilter(all, Number.NaN).ok).toBe(false);
  });

  it('TEST-PS-044-09.T05 the same filter and clock give identical SQL and params 200 times without reading the system clock', () => {
    const real = Date.now; let reads = 0;
    Date.now = () => { reads++; return real(); };
    try {
      const v = good(FULL);
      const first = JSON.stringify(compiled(v));
      for (let i = 0; i < 200; i++) expect(JSON.stringify(compiled(good(FULL)))).toBe(first);
      expect(reads).toBe(0);
      expect(compiled(v, NOW + 1000).params.at(-1)).not.toBe(compiled(v, NOW).params.at(-1));
    } finally { Date.now = real; }
  });

  describe('against SQLite', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`CREATE TABLE discovery_doc (
      rid INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, tenant_id TEXT NOT NULL, listing_kind TEXT NOT NULL, category_id TEXT NOT NULL,
      price_minor INTEGER, currency TEXT, condition TEXT, barter INTEGER NOT NULL DEFAULT 0,
      geo_cell5 TEXT NOT NULL DEFAULT '' CHECK (length(geo_cell5) IN (0,5)), first_seen_at TEXT NOT NULL, status TEXT NOT NULL);
      CREATE INDEX discovery_doc_cell ON discovery_doc(tenant_id, status, geo_cell5, first_seen_at);`);
    let seed = 12345;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    const centres = ['u4pru', 'u4prv', 'u4prs', 'ezs42', 'u33db', 's0000'];
    type Doc = { id: string; listing_kind: string; category_id: string; price_minor: number | null; currency: string | null; condition: string | null; barter: number; geo_cell5: string; first_seen_at: string };
    const docs: Doc[] = [];
    const ins = db.prepare('INSERT INTO discovery_doc (id, tenant_id, listing_kind, category_id, price_minor, currency, condition, barter, geo_cell5, first_seen_at, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (let i = 0; i < 1000; i++) {
      const base = centres[rnd(centres.length)] as string;
      const cells = cellsForRadius(base, 10); const pool = cells.ok ? cells.value : [base];
      const priced = rnd(5) !== 0;
      const d: Doc = {
        id: `doc-${i}`, listing_kind: mod.LISTING_KINDS[rnd(6)] as string, category_id: cat(rnd(20)), price_minor: priced ? rnd(60000) : null,
        currency: priced ? CURRENCIES[rnd(3)] as string : null, condition: rnd(6) === 0 ? null : mod.CONDITIONS[rnd(5)] as string, barter: rnd(2),
        geo_cell5: rnd(8) === 0 ? '' : pool[rnd(pool.length)] as string, first_seen_at: new Date(NOW - rnd(60 * 86_400_000)).toISOString(),
      };
      docs.push(d);
      ins.run(d.id, 't1', d.listing_kind, d.category_id, d.price_minor, d.currency, d.condition, d.barter, d.geo_cell5, d.first_seen_at, 'active');
    }
    const brute = (v: ValidatedFilter): string[] => docs.filter(d => {
      const f = v.filter;
      if (f.categoryIds && !v.categoryIds.includes(d.category_id)) return false;
      if (f.listingKinds && !f.listingKinds.includes(d.listing_kind as never)) return false;
      if (f.price) {
        if (d.currency !== f.price.currency || d.price_minor === null) return false;
        if (f.price.min !== undefined && d.price_minor < f.price.min) return false;
        if (f.price.max !== undefined && d.price_minor > f.price.max) return false;
      }
      if (f.conditions && !(d.condition !== null && f.conditions.includes(d.condition as never))) return false;
      if (f.distanceKm !== undefined && !v.cells.some(c => d.geo_cell5.startsWith(c) && d.geo_cell5.length === 5)) return false;
      if (f.barterAcceptable !== undefined && (d.barter === 1) !== f.barterAcceptable) return false;
      if (f.postedWithin) { const ms = { '24h': 86_400_000, '7d': 7 * 86_400_000, '30d': 30 * 86_400_000 }[f.postedWithin]; if (Date.parse(d.first_seen_at) < NOW - ms) return false; }
      return true;
    }).map(d => d.id).sort();
    const run = (v: ValidatedFilter): string[] => {
      const c = compiled(v);
      return (db.prepare(`SELECT d.id FROM discovery_doc d WHERE d.tenant_id = ? AND d.status = 'active' AND ${c.sql}`).all('t1', ...c.params) as { id: string }[]).map(r => r.id).sort();
    };

    it('TEST-PS-044-09.T06 compiled filters over 1000 documents return exactly the brute-force result', () => {
      const filters: Filter[] = [FULL, { listingKinds: ['sell'], price: { currency: 'EUR', max: 30000 }, distanceKm: 10, centerCell: 'u4pru', postedWithin: '7d' }, { categoryIds: [cat(0)] },
        { distanceKm: 50, centerCell: 'u4pru' }, { distanceKm: 100, centerCell: 'ezs42', barterAcceptable: false }, { conditions: ['new', 'fair'], price: { currency: 'USD', min: 100 } }, { postedWithin: '24h' }, {}];
      for (let i = 0; i < 150; i++) {
        filters.push({
          ...(rnd(2) ? { categoryIds: [cat(rnd(20))] } : {}), ...(rnd(2) ? { listingKinds: [mod.LISTING_KINDS[rnd(6)] as mod.ListingKind] } : {}),
          ...(rnd(2) ? { price: { currency: CURRENCIES[rnd(3)] as string, ...(rnd(2) ? { min: rnd(30000) } : {}), ...(rnd(2) ? { max: 30000 + rnd(30000) } : {}) } } : {}),
          ...(rnd(3) === 0 ? { conditions: [mod.CONDITIONS[rnd(5)] as mod.Condition] } : {}), ...(rnd(2) ? { distanceKm: ([5, 10, 25, 50, 100] as const)[rnd(5)] as 5, centerCell: centres[rnd(centres.length)] as string } : {}),
          ...(rnd(3) === 0 ? { barterAcceptable: rnd(2) === 0 } : {}), ...(rnd(2) ? { postedWithin: (['24h', '7d', '30d'] as const)[rnd(3)] as '7d' } : {}),
        });
      }
      let nonEmpty = 0;
      for (const f of filters) {
        const v = validateFilter(f, ports());
        if (!v.ok) { expect(['DISCOVERY_RADIUS_TOO_LARGE']).toContain(v.error.code); continue; }
        const expected = brute(v.value);
        expect(run(v.value)).toEqual(expected);
        if (expected.length > 0) nonEmpty++;
      }
      expect(nonEmpty).toBeGreaterThan(100);
      expect(run(good({}))).toHaveLength(1000);
    });

    it('TEST-PS-044-09.T07 fuzz strings with SQL metacharacters never alter SQL, oversize lists are rejected and validation stays fast', () => {
      const before = db.prepare('SELECT count(*) AS n FROM discovery_doc').get() as { n: number };
      const evil = fc.sample(fc.oneof(fc.string({ unit: fc.constantFrom(...`'"; -/*)(%_\\\n\0 DROP TABLE x=?`.split('')), maxLength: 40 }), fc.constantFrom("' OR 1=1 --", '"; DROP TABLE discovery_doc; --', 'x\' UNION SELECT 1', '\u0000', '%', '\\')), 10_000);
      const strings = evil.length;
      let accepted = 0;
      for (const s of evil) {
        const slots: unknown[] = [{ categoryIds: [s] }, { listingKinds: [s] }, { conditions: [s] }, { price: { currency: s, max: 1 } }, { postedWithin: s }, { distanceKm: 10, centerCell: s }, { [s]: true }, { price: { currency: 'EUR', [s]: 1 } }];
        for (const slot of slots) {
          const r = validateFilter(slot, ports({ categories: { expand: id => ok([id]) }, currencies: { isRegistered: () => ok(true) } }));
          if (!r.ok) { expect(['DISCOVERY_FILTER_INVALID', 'DISCOVERY_FILTER_CURRENCY_REQUIRED', 'DISCOVERY_FILTER_CENTER_REQUIRED']).toContain(r.error.code); continue; }
          accepted++;
          const c = compiled(r.value);
          expect(c.sql).toMatch(/^[A-Za-z0-9_.?,() =<>]+$/);
          expect(s).toMatch(/^[A-Z]{3}$/); // the only fuzz strings that pass are well-formed currency codes, and they stay bound
          expect(c.sql).toBe('d.currency = ? AND d.price_minor <= ?'); expect(c.params).toEqual([s, 1]);
          db.prepare(`SELECT d.id FROM discovery_doc d WHERE ${c.sql}`).all(...c.params);
        }
      }
      expect(strings).toBe(10_000);
      expect(accepted).toBeLessThan(100);
      expect((db.prepare('SELECT count(*) AS n FROM discovery_doc').get() as { n: number }).n).toBe(before.n);
      // a string that does pass (a registered 3 letter code) is only ever a bound parameter
      const c = compiled(good({ price: { currency: 'EUR' } })); expect(c.sql).not.toContain('EUR'); expect(c.params).toContain('EUR');
      // oversize lists
      for (const key of ['categoryIds', 'listingKinds', 'conditions']) {
        const r = validateFilter({ [key]: Array.from({ length: 5000 }, (_, i) => cat(i)) }, ports());
        expect(!r.ok && r.error.code).toBe('DISCOVERY_FILTER_INVALID');
      }
      // timing: validate + compile of a filter with all keys and 200 categories
      const big = (id: string) => ok(id === cat(0) ? Array.from({ length: 199 }, (_, i) => cat(i + 1)) : [id]);
      const bigPorts = ports({ categories: { expand: big } });
      const input = { ...FULL, categoryIds: [cat(0)] };
      const times: number[] = [];
      for (let i = 0; i < 300; i++) {
        const t0 = performance.now(); const v = validateFilter(input, bigPorts); if (!v.ok) throw new Error('big'); compileFilter(v.value, NOW); times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      expect(times[Math.floor(times.length * 0.95)] as number).toBeLessThan(1);
    });
  });

  it('TEST-PS-044-09.T08 exports no commands, queries, events or capabilities and error codes map to the documented ones', () => {
    for (const name of Object.keys(mod)) expect(name).not.toMatch(/command|query|event|capab|repo|definitions/i);
    expect(Object.keys(discoveryFilterErrors.codes).sort()).toEqual(['DISCOVERY_FILTER_CENTER_REQUIRED', 'DISCOVERY_FILTER_CURRENCY_REQUIRED', 'DISCOVERY_FILTER_INVALID']);
    for (const spec of Object.values(discoveryFilterErrors.codes)) expect(spec).toEqual({ status: 422, retryable: false });
    expect(bad({ distanceKm: 1 }).code).toBe('DISCOVERY_RADIUS_TOO_SMALL');
    expect(bad({ distanceKm: 1 }).status).toBe(422);
  });

  it('TEST-PS-044-09.T09 filtering on a private column name is rejected as an unknown key', () => {
    for (const key of ['owner_id', 'author_did', 'authorDid', 'title', 'body', 'tenant_id', 'status', 'projection_cid', 'promoted_until', 'price_minor', 'geo_cell5', 'sql', '__proto__', 'constructor']) {
      const input = JSON.parse(`{"${key}": "x"}`) as unknown;
      const e = bad(input);
      expect([e.code, e.fields?.[0]?.path]).toEqual(['DISCOVERY_FILTER_INVALID', key]);
    }
    expect(Object.keys(mod).some(k => /capab/i.test(k))).toBe(false);
  });

  it('TEST-PS-044-09.T10 an unavailable taxonomy or currency port yields DEPENDENCY_UNAVAILABLE and a stale snapshot validates with a hint', () => {
    const down = (): Result<never, AppError> => err(appError('DEPENDENCY_UNAVAILABLE'));
    expect(bad({ categoryIds: [cat(1)] }, ports({ categories: { expand: down } })).code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(bad({ categoryIds: [cat(1)] }, ports({ categories: { expand: () => { throw new Error('boom'); } } })).code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(bad({ price: { currency: 'EUR' } }, ports({ currencies: { isRegistered: down } })).code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(bad({ price: { currency: 'EUR' } }, ports({ currencies: { isRegistered: () => { throw new Error('boom'); } } })).code).toBe('DEPENDENCY_UNAVAILABLE');
    const stale = good({ categoryIds: [cat(1)] }, ports({ categories: { expand: id => ok([id]), snapshotAgeMs: () => 31 * 86_400_000 } }));
    expect(stale.hints.categoriesMayBeOutOfDate).toBe(true); expect(stale.categoryIds).toEqual([cat(1)]);
    const fresh = good({ categoryIds: [cat(1)] }, ports({ categories: { expand: id => ok([id]), snapshotAgeMs: () => 30 * 86_400_000 } }));
    expect(fresh.hints.categoriesMayBeOutOfDate).toBe(false);
    // expansion above 200 ids is rejected, never truncated
    const e = bad({ categoryIds: [cat(1)] }, ports({ categories: { expand: () => ok(Array.from({ length: 201 }, (_, i) => cat(i + 1000))) } }));
    expect([e.code, e.fields?.[0]?.path]).toEqual(['DISCOVERY_FILTER_INVALID', 'categoryIds']);
    const exactly = good({ categoryIds: [cat(1)] }, ports({ categories: { expand: () => ok(Array.from({ length: 199 }, (_, i) => cat(i + 1000))) } }));
    expect(exactly.categoryIds).toHaveLength(200);
  });

  it('TEST-PS-044-09.T13 a v1 filter stored in a saved search export parses unchanged and an unknown key is rejected on import', () => {
    const stored = JSON.stringify({ savedSearches: [{ name: 'bikes', filter: filterCacheKey(FULL) && JSON.parse(filterCacheKey(FULL)) as unknown }] });
    const imported = (JSON.parse(stored) as { savedSearches: { filter: unknown }[] }).savedSearches[0]?.filter;
    const v = good(imported);
    expect(JSON.stringify(v.filter)).toBe(JSON.stringify(imported)); expect(filterCacheKey(v.filter)).toBe(filterCacheKey(FULL));
    const tampered = { ...(imported as object), futureKey: 1 };
    expect(bad(tampered).code).toBe('DISCOVERY_FILTER_INVALID'); expect(bad(tampered).fields?.[0]?.path).toBe('futureKey');
    expect(mod.FILTER_SCHEMA).toBe('classrup.discovery.filter/v1');
  });
});
