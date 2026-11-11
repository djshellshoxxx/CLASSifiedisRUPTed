import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import * as coarse from './index.ts';
import { assertPublicCell, bucketBetween, cellsForRadius, checkPublisherGuardsCells, decode, discoveryGeoErrors, encode, neighbors, snap, type Bucket, type Cell } from './index.ts';
import { encodeAny } from './test-support.ts';
import { haversineKm } from './geohash.ts';

const vectors = JSON.parse(readFileSync(new URL('./vectors.json', import.meta.url), 'utf8')) as {
  encode: { lat: number; lon: number; precision: 4 | 5 | 6; cell: string }[]; encode11: { lat: number; lon: number; cell: string };
};
const val = <T>(r: { ok: boolean; value?: T; error?: unknown }): T => { if (!r.ok) throw new Error(JSON.stringify(r.error)); return r.value as T; };
const code = (r: { ok: boolean; error?: { code: string } }) => (r.ok ? 'OK' : r.error?.code);
const lat = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
const lon = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });
const runs = { numRuns: 1000 };

describe('PS-047 coarse location regions', () => {
  it('TEST-PS-047-09.T01 matches published geohash vectors and decode centres lie within cell bounds', () => {
    for (const v of vectors.encode) {
      expect(val(encode(v.lat, v.lon, v.precision))).toBe(v.cell);
      const d = val(decode(v.cell));
      expect(d.bounds.latMin).toBeLessThanOrEqual(d.lat); expect(d.lat).toBeLessThanOrEqual(d.bounds.latMax);
      expect(d.bounds.lonMin).toBeLessThanOrEqual(d.lon); expect(d.lon).toBeLessThanOrEqual(d.bounds.lonMax);
      expect(v.lat).toBeGreaterThanOrEqual(d.bounds.latMin); expect(v.lat).toBeLessThanOrEqual(d.bounds.latMax);
      expect(v.lon).toBeGreaterThanOrEqual(d.bounds.lonMin); expect(v.lon).toBeLessThanOrEqual(d.bounds.lonMax);
    }
    expect(encodeAny(vectors.encode11.lat, vectors.encode11.lon, 11)).toBe('u4pruydqqvj');
    expect(val(snap(57.64911, 10.40744, 'L2'))).toBe('u4pru');
    expect(val(snap(57.64911, 10.40744, 'L1'))).toBe('u4pr');
    expect(val(snap(57.64911, 10.40744, 'L3'))).toBe('u4pruy');
    const edge = val(decode('zzzz')); expect(edge.bounds.latMax).toBe(90); expect(edge.bounds.lonMax).toBe(180);
  });

  it('TEST-PS-047-09.T02 snap is idempotent, cells contain their points and points of one cell snap alike', () => {
    fc.assert(fc.property(lat, lon, fc.constantFrom('L1' as const, 'L2' as const, 'L3' as const), (a, o, level) => {
      const cell = val(snap(a, o, level));
      const d = val(decode(cell));
      expect(a >= d.bounds.latMin && a <= d.bounds.latMax && o >= d.bounds.lonMin && o <= d.bounds.lonMax).toBe(true);
      expect(val(snap(d.lat, d.lon, level))).toBe(cell);
      // a second point inside the same cell snaps to the same cell
      const a2 = d.bounds.latMin + (d.bounds.latMax - d.bounds.latMin) * 0.25;
      const o2 = d.bounds.lonMin + (d.bounds.lonMax - d.bounds.lonMin) * 0.75;
      expect(val(snap(a2, o2, level))).toBe(cell);
    }), { numRuns: 10000, seed: 47 });
  });

  it('TEST-PS-047-09.T03 neighbour relation is symmetric with 8 distinct neighbours except at poles and wraps at longitude 180', () => {
    fc.assert(fc.property(lat, lon, fc.constantFrom(4 as const, 5 as const, 6 as const), (a, o, p) => {
      const cell = val(encode(a, o, p));
      const ns = val(neighbors(cell));
      expect(new Set(ns).size).toBe(ns.length);
      expect(ns).not.toContain(cell);
      const d = val(decode(cell));
      const polar = d.bounds.latMin === -90 || d.bounds.latMax === 90;
      expect(ns.length).toBe(polar ? 5 : 8);
      for (const n of ns) expect(val(neighbors(n))).toContain(cell);
    }), runs);
    const east = val(encode(10, 179.99, 5)); const west = val(encode(10, -179.99, 5));
    expect(val(neighbors(east))).toContain(west);
    expect(val(neighbors('zzzz'))).toHaveLength(5);
  });

  it('TEST-PS-047-09.T04 invalid coordinates, cells and precision return the documented code and no value', () => {
    for (const [a, o] of [[Number.NaN, 0], [91, 0], [-91, 0], [0, -181], [0, 181], [0, Number.POSITIVE_INFINITY]] as const) {
      const r = encode(a, o, 5); expect(r.ok).toBe(false); expect(code(r)).toBe('DISCOVERY_COORD_INVALID');
      expect(code(snap(a, o, 'L2'))).toBe('DISCOVERY_COORD_INVALID');
    }
    expect(code(encode(1, 1, 7 as never))).toBe('VALIDATION_FAILED');
    expect(code(encode(1, 1, 3 as never))).toBe('VALIDATION_FAILED');
    for (const bad of ['U4PRU', 'u4pra', 'u4p', 'u4pruyx', '', 'u4 ru', 'u4pr\n']) {
      const d = decode(bad); expect(d.ok).toBe(false); expect(code(d)).toBe('VALIDATION_FAILED');
      expect(code(neighbors(bad))).toBe('VALIDATION_FAILED');
      expect(code(cellsForRadius(bad, 5))).toBe('VALIDATION_FAILED');
      expect(code(bucketBetween(bad, 'u4pru'))).toBe('VALIDATION_FAILED');
    }
    expect(code(assertPublicCell('U4PRU'))).toBe('VALIDATION_FAILED');
    expect(code(snap(1, 1, 'L4' as never))).toBe('VALIDATION_FAILED');
  });

  it('TEST-PS-047-09.T05 assertPublicCell accepts lengths 0, 4, 5 and rejects 6 and 11', () => {
    expect(val(assertPublicCell(''))).toBe('');
    expect(val(assertPublicCell('u4pr'))).toBe('u4pr');
    expect(val(assertPublicCell('u4pru'))).toBe('u4pru');
    expect(code(assertPublicCell('u4pruy'))).toBe('DISCOVERY_PRECISION_FORBIDDEN');
    expect(code(assertPublicCell('u4pruydqqvj'))).toBe('DISCOVERY_PRECISION_FORBIDDEN');
    expect(code(assertPublicCell('u4p'))).toBe('DISCOVERY_PRECISION_FORBIDDEN');
    expect(val(snap(10, 10, 'L0'))).toBe('');
  });

  it('TEST-PS-047-09.T06 radius 1, 3, 7 and 200 are rejected as too small, 100 is accepted within 512 cells', () => {
    for (const r of [1, 3, 7, 200, 0, -5, Number.NaN]) expect(code(cellsForRadius('u4pru', r))).toBe('DISCOVERY_RADIUS_TOO_SMALL');
    for (const r of [5, 10, 25, 50, 100]) {
      const cells = val(cellsForRadius('u4pru', r));
      expect(cells.length).toBeGreaterThan(0); expect(cells.length).toBeLessThanOrEqual(512);
    }
    // below a pole the circle needs far more than 512 cells: rejected, never truncated
    const polar = cellsForRadius(val(encode(89.99, 10, 4)), 100);
    expect(code(polar)).toBe('DISCOVERY_RADIUS_TOO_LARGE');
    expect(code(cellsForRadius(val(encode(89.99, 10, 5)), 25))).toBe('DISCOVERY_RADIUS_TOO_LARGE');
  });

  it('TEST-PS-047-09.T07 bucketBetween is symmetric, monotone in distance and never returns a number', () => {
    const order: Bucket[] = ['lt5', '5_10', '10_25', '25_50', 'gt50'];
    fc.assert(fc.property(lat, lon, fc.double({ min: -2, max: 2, noNaN: true }), fc.double({ min: -2, max: 2, noNaN: true }), lat, lon, (a, o, da, dob, a2, o2) => {
      const c1 = val(encode(a, o, 5));
      const near = val(encode(Math.max(-90, Math.min(90, a + da)), Math.max(-180, Math.min(180, o + dob)), 5));
      const far = val(encode(a2, o2, 4));
      for (const [x, y] of [[c1, near], [c1, far]] as const) {
        const ab = val(bucketBetween(x, y)); const ba = val(bucketBetween(y, x));
        expect(ab).toBe(ba); expect(typeof ab).toBe('string'); expect(order).toContain(ab);
      }
      const dn = decode(near).ok ? haversineKm(val(decode(c1)).lat, val(decode(c1)).lon, val(decode(near)).lat, val(decode(near)).lon) : 0;
      const df = haversineKm(val(decode(c1)).lat, val(decode(c1)).lon, val(decode(far)).lat, val(decode(far)).lon);
      const bn = order.indexOf(val(bucketBetween(c1, near))); const bf = order.indexOf(val(bucketBetween(c1, far)));
      if (dn <= df) expect(bn).toBeLessThanOrEqual(bf); else expect(bn).toBeGreaterThanOrEqual(bf);
    }), runs);
    expect(val(bucketBetween('u4pru', 'u4prv'))).toBe('lt5');
    expect(val(bucketBetween('u4pru', 'u4pru'))).toBe('lt5');
    expect(val(bucketBetween('u4pr', 'u4qr'))).not.toBe('lt5');
    expect(val(bucketBetween(val(encode(0, 0, 5)), val(encode(0, 90, 5))))).toBe('gt50');
  });

  it('TEST-PS-047-09.T08 cellsForRadius at the antimeridian, near a pole and at the equator gives sorted unique cells within 512', () => {
    const cases: [number, number, number][] = [[0, 179.99, 25], [0, -179.99, 100], [10, 180, 50], [87, 20, 5], [-86, -100, 10], [0, 0, 10], [57.6, 10.4, 100]];
    for (const [a, o, r] of cases) {
      const center = val(encode(a, o, r <= 25 ? 5 : 4));
      const cells = val(cellsForRadius(center, r));
      expect(cells.length).toBeGreaterThan(0); expect(cells.length).toBeLessThanOrEqual(512);
      expect(cells).toEqual([...cells].sort()); expect(new Set(cells).size).toBe(cells.length);
      expect(cells).toContain(center);
      expect(cells.every(c => c.length === (r <= 25 ? 5 : 4))).toBe(true);
    }
    const wrap = val(cellsForRadius(val(encode(0, 179.99, 5)), 25));
    expect(wrap.some(c => val(decode(c)).lon > 179)).toBe(true); expect(wrap.some(c => val(decode(c)).lon < -179)).toBe(true);
    const nearPole = val(cellsForRadius(val(encode(87, 20, 5)), 5));
    expect(nearPole.length).toBeGreaterThan(20); // columns are narrow near the pole, so the circle spans many
    expect(code(cellsForRadius(val(encode(89.99, 20, 5)), 5))).toBe('DISCOVERY_RADIUS_TOO_LARGE'); // pole enclosed
    // cover property: every sampled point within the radius lies in a returned cell
    fc.assert(fc.property(fc.constantFrom(5, 10, 25, 50, 100), fc.double({ min: -85, max: 85, noNaN: true }), lon, fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 360, noNaN: true }), (r, a, o, f, bearing) => {
      const centre = val(encode(a, o, r <= 25 ? 5 : 4)); const c = val(decode(centre));
      const covered = cellsForRadius(centre, r);
      if (!covered.ok) { expect(covered.error.code).toBe('DISCOVERY_RADIUS_TOO_LARGE'); return; }
      const cells = covered.value;
      const d = f * r * 0.999 / 6371.0088; const br = bearing * Math.PI / 180; const la1 = c.lat * Math.PI / 180;
      const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(br));
      let lo2 = c.lon * Math.PI / 180 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
      lo2 = ((lo2 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const pt = val(encode(la2 * 180 / Math.PI, lo2 * 180 / Math.PI, r <= 25 ? 5 : 4));
      expect(cells).toContain(pt);
    }), { numRuns: 400, seed: 8 });
  });

  it('TEST-PS-047-09.T09 exports no command, query, event or capability and errors map to documented codes', () => {
    for (const [name, value] of Object.entries(coarse)) {
      expect(name).not.toMatch(/command|query|event|capab|repo|definitions/i);
      if (typeof value === 'object' && value !== null) expect(value).not.toHaveProperty('capability');
    }
    expect(Object.keys(discoveryGeoErrors.codes).sort()).toEqual(['DISCOVERY_COORD_INVALID', 'DISCOVERY_PRECISION_FORBIDDEN', 'DISCOVERY_RADIUS_TOO_LARGE', 'DISCOVERY_RADIUS_TOO_SMALL']);
    for (const c of Object.values(discoveryGeoErrors.codes)) expect(c).toEqual({ status: 422, retryable: false });
    const e = encode(Number.NaN, 0, 5); expect(!e.ok && e.error).toMatchObject({ code: 'DISCOVERY_COORD_INVALID', status: 422, retryable: false });
  });

  it('TEST-PS-047-09.T10 the same call sequence 200 times is byte-identical and performs no I/O, clock or randomness', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('io'); });
    const nowSpy = vi.spyOn(Date, 'now'); const randSpy = vi.spyOn(Math, 'random');
    try {
      const run = () => JSON.stringify([encode(42.6, -5.6, 5), decode('ezs42'), neighbors('ezs42'), snap(57.64911, 10.40744, 'L2'), assertPublicCell('u4pruy'), cellsForRadius('u4pru', 100), bucketBetween('u4pru', 'u4prv')]);
      const first = run();
      for (let i = 0; i < 200; i++) expect(run()).toBe(first);
      expect(fetchSpy).not.toHaveBeenCalled(); expect(nowSpy).not.toHaveBeenCalled(); expect(randSpy).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); }
  });

  it('TEST-PS-047-09.T11 no function in the public API returns coordinates or public cells longer than 5 characters, and the contract helper fails a publisher without the guard', async () => {
    const scan = (v: unknown, path: string): void => {
      if (typeof v === 'string' && /^[0-9b-hjkmnp-z]{6,}$/.test(v)) throw new Error(`long cell at ${path}`);
      if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, `${path}.${k}`);
    };
    const results: unknown[] = [];
    fc.assert(fc.property(lat, lon, (a, o) => {
      const c4 = val(snap(a, o, 'L1')); const c5 = val(snap(a, o, 'L2'));
      results.push(snap(a, o, 'L1'), snap(a, o, 'L2'), neighbors(c5), bucketBetween(c4, c5), cellsForRadius(c5, 10), assertPublicCell(c5), assertPublicCell(c4));
      expect(assertPublicCell(val(snap(a, o, 'L3'))).ok).toBe(false);
    }), { numRuns: 100, seed: 11 });
    scan(results, 'results');
    // snap/bucket/assert never echo the input coordinates or a numeric distance
    const b = val(bucketBetween('u4pru', 'u4prv')); expect(typeof b).toBe('string');
    expect(JSON.stringify(snap(57.64911, 10.40744, 'L2'))).not.toContain('57.64911');
    const good = await checkPublisherGuardsCells(c => assertPublicCell(c));
    expect(good.ok).toBe(true);
    const throwing = await checkPublisherGuardsCells(c => { const r = assertPublicCell(c); if (!r.ok) throw new Error('refused'); return r; });
    expect(throwing.ok).toBe(true);
    const fake = await checkPublisherGuardsCells(c => ({ ok: true, value: c }));
    expect(fake.ok).toBe(false); expect(code(fake)).toBe('DISCOVERY_PRECISION_FORBIDDEN');
  });

  it('TEST-PS-047-09.T14 the package exports no persistence and the vectors file keeps the published vectors', () => {
    expect(Object.keys(coarse).filter(k => /repo|storage|store|persist/i.test(k))).toEqual([]);
    const byKey = new Map(vectors.encode.map(v => [`${v.lat},${v.lon},${v.precision}`, v.cell]));
    expect(byKey.get('42.6,-5.6,5')).toBe('ezs42'); expect(byKey.get('57.64911,10.40744,5')).toBe('u4pru');
    expect(byKey.get('0,0,5')).toBe('s0000'); expect(byKey.get('-90,-180,4')).toBe('0000'); expect(byKey.get('90,180,4')).toBe('zzzz');
    expect(vectors.encode11).toEqual({ lat: 57.64911, lon: 10.40744, cell: 'u4pruydqqvj' });
  });

  it('keeps exact boundaries stable and returns a bucket at exactly the edges', () => {
    expect(val(encode(90, 180, 6))).toBe('zzzzzz'); expect(val(encode(-90, -180, 6))).toBe('000000');
    const cell: Cell = 'ezs42'; const d = val(decode(cell));
    expect(val(encode(d.bounds.latMin, d.bounds.lonMin, 5))).toBe(cell);
  });
});
