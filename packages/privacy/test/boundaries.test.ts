import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DisclosureClass } from '@classrup/kernel';
import { DAY, DomainError, HOUR, MINUTE } from '@classrup/kernel';
import {
  ADVERSARIES, ASSETS, assertNoSensitiveKeys, canDisclose, coarsenTimestamp, DISCLOSURE_CLASSES, filterByDisclosure, findSensitiveKeys, isSensitiveKey,
  THREATS, truncateIp, validateThreatRegister, VIEWER_RELATIONS,
} from '../src/index';
import type { ViewerRelation } from '../src/index';
import { anon, ctx, makeWorld, user } from './helpers';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

describe('F10.S02.M03 filterByDisclosure', () => {
  const record = { name: 'Ann', region: 'u4pru', phoneHint: '***12', note: 'x', token: 'secret', unclassified: 1 };
  const classes = { name: 'public', region: 'participants', phoneHint: 'private', token: 'secret', note: 'private' } as const;

  it('shows each viewer exactly what the matrix allows and drops unclassified fields', () => {
    expect(filterByDisclosure(record, classes, 'public')).toEqual({ name: 'Ann' });
    expect(filterByDisclosure(record, classes, 'participant')).toEqual({ name: 'Ann', region: 'u4pru' });
    expect(filterByDisclosure(record, classes, 'operator')).toEqual({ name: 'Ann', region: 'u4pru' });
    expect(filterByDisclosure(record, classes, 'self')).toEqual({ name: 'Ann', region: 'u4pru', phoneHint: '***12', note: 'x' });
  });

  it('is monotone: public view is a subset of participant view is a subset of self view; secret never appears (property)', () => {
    const cls = fc.constantFrom<DisclosureClass>('public', 'participants', 'private', 'secret');
    fc.assert(
      fc.property(fc.dictionary(fc.stringMatching(/^[a-z]{1,6}$/), cls, { maxKeys: 8 }), (fieldClasses) => {
        const rec = Object.fromEntries(Object.keys(fieldClasses).map((k) => [k, `v-${k}`]));
        const keys = (r: ViewerRelation) => Object.keys(filterByDisclosure(rec, fieldClasses, r));
        const subset = (a: string[], b: string[]) => a.every((k) => b.includes(k));
        const secrets = Object.entries(fieldClasses).filter(([, c]) => c === 'secret').map(([k]) => k);
        return (
          subset(keys('public'), keys('participant')) &&
          subset(keys('participant'), keys('self')) &&
          VIEWER_RELATIONS.every((r) => secrets.every((k) => !keys(r).includes(k))) &&
          keys('public').every((k) => fieldClasses[k] === 'public')
        );
      }),
    );
  });

  it('matrix: secret is never disclosed, private only to self', () => {
    for (const r of VIEWER_RELATIONS) expect(canDisclose('secret', r)).toBe(false);
    expect(DISCLOSURE_CLASSES.filter((c) => canDisclose(c, 'public'))).toEqual(['public']);
    expect(VIEWER_RELATIONS.filter((r) => canDisclose('private', r))).toEqual(['self']);
  });
});

describe('F10.S02.M03 coarsenTimestamp', () => {
  const ts = fc.integer({ min: 0, max: 4_102_444_800_000 });
  const epoch = Date.UTC(1970, 0, 1);
  const grains = ['minute', 'hour', 'day', 'week'] as const;
  const size = { minute: MINUTE, hour: HOUR, day: DAY, week: 7 * DAY };

  it('floors within one granule, is idempotent and monotone (property)', () => {
    fc.assert(
      fc.property(ts, ts, fc.constantFrom(...grains), (a, b, g) => {
        const c = coarsenTimestamp(a, g);
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return c <= a && a - c < size[g] && coarsenTimestamp(c, g) === c && coarsenTimestamp(lo, g) <= coarsenTimestamp(hi, g);
      }),
    );
  });

  it('aligns to UTC boundaries; weeks start on Monday', () => {
    const wed = Date.UTC(2026, 0, 7, 15, 42, 11, 123);
    expect(coarsenTimestamp(wed, 'minute')).toBe(Date.UTC(2026, 0, 7, 15, 42));
    expect(coarsenTimestamp(wed, 'hour')).toBe(Date.UTC(2026, 0, 7, 15));
    expect(coarsenTimestamp(wed, 'day')).toBe(Date.UTC(2026, 0, 7));
    expect(coarsenTimestamp(wed, 'week')).toBe(Date.UTC(2026, 0, 5));
    expect(new Date(coarsenTimestamp(wed, 'week')).getUTCDay()).toBe(1);
    expect(coarsenTimestamp(epoch, 'week')).toBe(Date.UTC(1969, 11, 29));
    expect(() => coarsenTimestamp(Number.NaN, 'day')).toThrow(RangeError);
    expect(() => coarsenTimestamp(1.5, 'day')).toThrow(RangeError);
  });
});

describe('F10.S02.M03 truncateIp', () => {
  it('truncates IPv4 to /24 and IPv6 to /48 and is idempotent (properties)', () => {
    fc.assert(
      fc.property(fc.ipV4(), (ip) => {
        const t = truncateIp(ip);
        return t.endsWith('.0') && t.split('.').slice(0, 3).join('.') === ip.split('.').slice(0, 3).join('.') && truncateIp(t) === t;
      }),
    );
    const groups = fc.array(fc.integer({ min: 0, max: 0xffff }), { minLength: 8, maxLength: 8 });
    fc.assert(
      fc.property(groups, (g) => {
        const ip = g.map((x) => x.toString(16).padStart(4, '0')).join(':');
        const t = truncateIp(ip);
        const again = truncateIp(t);
        const [a = 0, b = 0, c = 0] = g;
        return t === `${a.toString(16)}:${b.toString(16)}:${c.toString(16)}::` && again === t;
      }),
    );
  });

  it('handles compressed, mapped, uppercase and invalid input', () => {
    expect(truncateIp('192.168.10.77')).toBe('192.168.10.0');
    expect(truncateIp('2001:db8:abcd:12::1')).toBe('2001:db8:abcd::');
    expect(truncateIp('2001:DB8::1')).toBe('2001:db8:0::');
    expect(truncateIp('::1')).toBe('0:0:0::');
    expect(truncateIp('::ffff:192.0.2.55')).toBe('192.0.2.0');
    expect(truncateIp('2001:db8::10.0.0.1')).toBe('2001:db8:0::');
    for (const bad of ['', '256.1.1.1', '1.2.3', '01.2.3.4', 'hello', '1::2::3', '1:2:3:4:5:6:7:8:9', '12345::1', ':1:2:3:4:5:6:7', '1.2.3.4::', 'fe80::1%eth0']) {
      expect(codeOf(() => truncateIp(bad))).toBe('PRIVACY.IP_INVALID');
    }
  });
});

describe('F10.S02.M03 assertNoSensitiveKeys', () => {
  it('rejects location and contact keys at any depth, naming paths only', () => {
    expect(() => assertNoSensitiveKeys({ title: 'Bike', price: { currency: 'USD', minor: '100' }, regionCell: 'u4pru', tags: ['a'] })).not.toThrow();
    for (const key of ['lat', 'lng', 'latitude', 'longitude', 'address', 'homeAddress', 'street_name', 'email', 'userEmail', 'phone', 'phone_number', 'exactLocation', 'GPS']) {
      expect(codeOf(() => assertNoSensitiveKeys({ ok: { deep: [{ [key]: 'x' }] } }))).toBe('PRIVACY.SENSITIVE_KEY');
    }
    expect(findSensitiveKeys({ a: [{ b: { homeAddress: 'secret street 1' } }], lat: 1 })).toEqual(['a[0].b.homeAddress', 'lat']);
    try {
      assertNoSensitiveKeys({ owner: { email: 'a@b.c' } });
    } catch (e) {
      expect(JSON.stringify((e as DomainError).details)).not.toContain('a@b.c');
    }
    expect(isSensitiveKey('platform')).toBe(false);
    expect(isSensitiveKey('latency')).toBe(false);
    expect(isSensitiveKey('translateX')).toBe(false);
  });

  it('survives cycles and very deep structures', () => {
    const cyclic: Record<string, unknown> = { title: 'x' };
    cyclic.self = cyclic;
    expect(() => assertNoSensitiveKeys(cyclic)).not.toThrow();
    let deep: Record<string, unknown> = { lat: 1 };
    for (let i = 0; i < 200; i++) deep = { child: deep };
    expect(() => assertNoSensitiveKeys(deep)).not.toThrow();
  });

  it('detects an injected sensitive key at a random depth and passes clean trees (property)', () => {
    const safeKey = fc.constantFrom('title', 'price', 'regionCell', 'createdAt', 'items', 'meta', 'status', 'count', 'tags');
    const sensitive = fc.constantFrom('lat', 'lng', 'address', 'email', 'phone', 'homeAddress', 'contactEmail');
    const tree: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
      node: fc.oneof(
        { depthSize: 'small', maxDepth: 4 },
        fc.string(),
        fc.integer(),
        fc.array(tie('node'), { maxLength: 3 }),
        fc.dictionary(safeKey, tie('node'), { maxKeys: 3 }),
      ),
    })).node;
    fc.assert(
      fc.property(tree, sensitive, fc.nat(4), (clean, bad, depth) => {
        expect(findSensitiveKeys(clean)).toEqual([]);
        let wrapped: unknown = { [bad]: 'v' };
        for (let i = 0; i < depth; i++) wrapped = i % 2 === 0 ? { nested: wrapped } : [wrapped];
        const polluted = { payload: clean, wrapped };
        return codeOf(() => assertNoSensitiveKeys(polluted)) === 'PRIVACY.SENSITIVE_KEY' && findSensitiveKeys(polluted).some((p) => p.endsWith(bad));
      }),
    );
  });
});

describe('F10.S02.M01/M02 threat register and model', () => {
  it('is internally consistent and covers the required threat classes', () => {
    expect(validateThreatRegister()).toEqual([]);
    const text = THREATS.map((t) => `${t.title} ${t.mitigation}`).join(' ').toLowerCase();
    for (const topic of ['triangulation', 'deanonymisation', 'sybil', 'metadata']) expect(text).toContain(topic);
    expect(new Set(THREATS.map((t) => t.category))).toContain('location');
    expect(THREATS.filter((t) => t.status === 'accepted').every((t) => t.residualRisk === 'high')).toBe(true);
    expect(validateThreatRegister([{ ...(THREATS[0] as (typeof THREATS)[number]), assets: ['A-NOPE'] }])).toEqual(['T-GEO-01: unknown asset A-NOPE']);
  });

  it('every code reference points at an existing file that mentions the symbol', () => {
    for (const threat of THREATS) {
      for (const ref of threat.controls) {
        const file = `${repoRoot}${ref.path}`;
        expect(existsSync(file), `${threat.id} -> ${ref.path}`).toBe(true);
        expect(readFileSync(file, 'utf8'), `${threat.id} -> ${ref.symbol}`).toContain(ref.symbol);
      }
    }
  });

  it('classifies assets with valid disclosure classes and matches secrets to never-disclosed', () => {
    expect(ASSETS.every((a) => DISCLOSURE_CLASSES.includes(a.disclosure))).toBe(true);
    expect(ASSETS.filter((a) => a.disclosure === 'secret').map((a) => a.id)).toEqual(['A-DEVICE-KEYS', 'A-SESSION', 'A-RECOVERY']);
    expect(ADVERSARIES.length).toBeGreaterThanOrEqual(6);
  });

  it('serves the catalog and model to signed-in users only', () => {
    const w = makeWorld();
    const catalog = w.privacy.boundaries.threats(ctx(user('alice')));
    expect(catalog.threats).toHaveLength(THREATS.length);
    expect(catalog.summary.mitigated + catalog.summary.partially_mitigated + catalog.summary.accepted).toBe(THREATS.length);
    expect(w.privacy.boundaries.model(ctx(user('alice'))).matrix.secret).toEqual([]);
    expect(codeOf(() => w.privacy.boundaries.threats(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.privacy.boundaries.model(anon()))).toBe('AUTH.REQUIRED');
  });
});
