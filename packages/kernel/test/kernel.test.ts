import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  allocate, canonicalize, convert, createIdGenerator, createTestDeps, ctxFor, decodeJson, divRound, DomainError, encodeJson,
  formatMajor, idTime, InMemoryEventBus, isId, ManualClock, money, parseMajor, runCommand, SchemaRegistry, seededRandom,
  staticFlags, testActor, z, type FxQuote, type RoundingMode,
} from '../src/index';

describe('ids', () => {
  it('generates prefixed, sortable, monotonic ULIDs', () => {
    const clock = new ManualClock(1_700_000_000_000);
    const ids = createIdGenerator(clock, seededRandom(1));
    const a = ids.next('lst');
    const b = ids.next('lst');
    clock.advance(1);
    const c = ids.next('lst');
    expect(isId(a, 'lst')).toBe(true);
    expect(a < b && b < c).toBe(true);
    expect(idTime(a)).toBe(1_700_000_000_000);
    expect(isId('lst_bad')).toBe(false);
  });
});

describe('json', () => {
  it('canonicalizes per JCS key order and rejects ambiguous values', () => {
    expect(canonicalize({ b: 1, a: [true, null, 'x'], c: undefined })).toBe('{"a":[true,null,"x"],"b":1}');
    expect(() => canonicalize({ a: 1n })).toThrow();
    expect(() => canonicalize(Number.NaN)).toThrow();
    expect(() => canonicalize(new Date())).toThrow();
  });
  it('round-trips bigint losslessly', () => {
    fc.assert(fc.property(fc.bigInt(), (n) => decodeJson<{ n: bigint }>(encodeJson({ n })).n === n));
  });
});

describe('money', () => {
  it('rounds with every mode correctly', () => {
    const cases: [bigint, bigint, RoundingMode, bigint][] = [
      [5n, 2n, 'half_even', 2n], [7n, 2n, 'half_even', 4n], [-5n, 2n, 'half_even', -2n], [5n, 2n, 'half_up', 3n],
      [-5n, 2n, 'half_up', -3n], [5n, 2n, 'half_down', 2n], [7n, 3n, 'down', 2n], [7n, 3n, 'up', 3n], [-7n, 3n, 'floor', -3n],
      [-7n, 3n, 'ceil', -2n], [7n, -2n, 'half_even', -4n],
    ];
    for (const [n, d, m, want] of cases) expect(divRound(n, d, m)).toBe(want);
  });
  it('allocation always sums to total (property)', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 15n), max: 10n ** 15n }), fc.array(fc.bigInt({ min: 0n, max: 1000n }), { minLength: 1, maxLength: 12 }), (t, w) => {
        fc.pre(w.some((x) => x > 0n));
        const parts = allocate(money('USD', t), w);
        return parts.reduce((s, p) => s + p.minor, 0n) === t && parts.every((p, i) => (w[i] === 0n ? p.minor === 0n : true));
      }),
    );
  });
  it('parses and formats major units without floats', () => {
    expect(parseMajor('USD', '12.30').minor).toBe(1230n);
    expect(formatMajor(money('USD', -5n))).toBe('-0.05');
    expect(formatMajor(money('JPY', 500n))).toBe('500');
    expect(parseMajor('ETH', '1.000000000000000001').minor).toBe(10n ** 18n + 1n);
    expect(() => parseMajor('USD', '1.234')).toThrow(/decimal/);
    fc.assert(fc.property(fc.bigInt({ min: -(10n ** 20n), max: 10n ** 20n }), (m) => parseMajor('BTC', formatMajor(money('BTC', m))).minor === m));
  });
  it('converts with pinned quote and rejects expired quotes', () => {
    const q: FxQuote = { quoteId: 'q1', base: 'USD', quote: 'JPY', rateNum: 15012n, rateDen: 100n, source: 'test', asOf: 0, expiresAt: 1000 };
    expect(convert(money('USD', 1000n), q, 10).minor).toBe(1501n); // 10.00 USD * 150.12 = 1501.2 JPY
    expect(() => convert(money('USD', 1n), q, 1000)).toThrow(/expired/);
    expect(() => convert(money('EUR', 1n), q, 10)).toThrow(DomainError);
  });
});

describe('runCommand', () => {
  const run = (deps: ReturnType<typeof createTestDeps>, key: string | undefined, request: unknown, fail = false) =>
    runCommand(deps, ctxFor(testActor('acct_a'), key), { name: 'test.thing.create', request, flag: 'test.things' }, () => {
      const rec = deps.store.collection<{ id: string; version: number; n: number }>('things').put({ id: 't1', n: 1 }, 0);
      if (fail) throw new Error('boom');
      return { result: rec, events: [{ type: 'test.thing.created', aggregateType: 'thing', aggregateId: 't1', revision: 1, payload: {} }] };
    });

  it('commits records and events atomically and publishes after commit', () => {
    const deps = createTestDeps();
    const seen: string[] = [];
    deps.bus.subscribe('test.*', (e) => seen.push(e.type));
    run(deps, undefined, {});
    expect(deps.store.events.lastPosition()).toBe(1);
    expect(seen).toEqual(['test.thing.created']);
  });
  it('rolls back on failure', () => {
    const deps = createTestDeps();
    expect(() => run(deps, undefined, {}, true)).toThrow('boom');
    expect(deps.store.collection('things').count()).toBe(0);
    expect(deps.store.events.lastPosition()).toBe(0);
  });
  it('replays idempotent requests and rejects key reuse', () => {
    const deps = createTestDeps();
    const first = run(deps, 'idem-key-1', { a: 1 });
    const second = run(deps, 'idem-key-1', { a: 1 });
    expect(second).toEqual(first);
    expect(deps.store.events.lastPosition()).toBe(1);
    expect(() => run(deps, 'idem-key-1', { a: 2 })).toThrow(/reused/);
  });
  it('enforces feature flags and optimistic versions', () => {
    const off = createTestDeps({ flags: staticFlags(['test.things']) });
    expect(() => run(off, undefined, {})).toThrow(/disabled/);
    const deps = createTestDeps();
    run(deps, undefined, {});
    expect(() => run(deps, undefined, {})).toThrow(/concurrently/);
  });
});

describe('bus and schemas', () => {
  it('isolates handler errors and keeps FIFO on re-entrant publish', () => {
    const errors: unknown[] = [];
    const bus = new InMemoryEventBus({ onHandlerError: (e) => errors.push(e) });
    const order: string[] = [];
    const ev = (type: string) => ({ type }) as never;
    bus.subscribe('*', (e) => {
      order.push(e.type);
      if (e.type === 'a.b.c') bus.publish([ev('a.b.d')]);
    });
    bus.subscribe('a.b.c', () => {
      throw new Error('x');
    });
    bus.publish([ev('a.b.c'), ev('a.b.e')]);
    expect(order).toEqual(['a.b.c', 'a.b.e', 'a.b.d']);
    expect(errors).toHaveLength(1);
  });
  it('upcasts registered schema versions', () => {
    const reg = new SchemaRegistry();
    reg.register('x.y.z', 1, z.object({ name: z.string() }));
    reg.register('x.y.z', 2, z.object({ title: z.string() }), (p) => ({ title: (p as { name: string }).name }));
    expect(reg.decode('x.y.z', 1, { name: 'a' })).toEqual({ version: 2, payload: { title: 'a' } });
    expect(() => reg.decode('x.y.z', 3, {})).toThrow(/newer/);
  });
});

describe('geo', () => {
  it('encodes known geohash and coarsens without increasing precision', async () => {
    const { encodeGeohash, coarsenCell, assertPublicCell, decodeGeohash, neighbors, distanceMeters, cellCenter } = await import('../src/geo');
    expect(encodeGeohash({ lat: 57.64911, lng: 10.40744 }, 11)).toBe('u4pruydqqvj');
    expect(coarsenCell('u4pruydqqvj', 5)).toBe('u4pru');
    expect(coarsenCell('u4p', 5)).toBe('u4p');
    expect(() => assertPublicCell('u4pruy')).toThrow(/precise/);
    const b = decodeGeohash('u4pru');
    expect(b.minLat < 57.64911 && b.maxLat > 57.64911).toBe(true);
    expect(neighbors('u4pru')).toHaveLength(8);
    expect(Math.round(distanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) / 1000)).toBe(111);
    expect(cellCenter('u4pru').lat).toBeCloseTo((b.minLat + b.maxLat) / 2);
  });
});

describe('afterCommit', () => {
  it('nested commands publish only after outer commit and not at all on rollback', () => {
    const deps = createTestDeps();
    const seen: string[] = [];
    deps.bus.subscribe('*', (e) => seen.push(e.type));
    const inner = () =>
      runCommand(deps, ctxFor(testActor('acct_a')), { name: 'x.inner.run' }, () => ({
        result: 1,
        events: [{ type: 'x.inner.ran', aggregateType: 'x', aggregateId: 'i', revision: 1, payload: {} }],
      }));
    expect(() =>
      runCommand(deps, ctxFor(testActor('acct_a')), { name: 'x.outer.run' }, () => {
        inner();
        expect(seen).toEqual([]);
        throw new Error('rollback');
      }),
    ).toThrow('rollback');
    expect(seen).toEqual([]);
    runCommand(deps, ctxFor(testActor('acct_a')), { name: 'x.outer.run' }, () => (inner(), { result: 1 }));
    expect(seen).toEqual(['x.inner.ran']);
  });
});
