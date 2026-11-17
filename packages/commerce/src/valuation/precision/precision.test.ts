import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unwrap } from '@classrup/kernel';
import { add, allocate, capFee, cmp, convert, formatDecimal, money, moneyErrors, neg, parseDecimal, parseMinor, percentBps, sign, splitEven, sub, sum, toWire, type Money } from './index.ts';

const SEED = 740016;
const RUNS = 10000;
const make = (amount: bigint | string, currency = 'CAD'): Money => unwrap(money(amount, currency));
const error = (result: { ok: boolean; error?: { code: string } }): string | undefined => result.error?.code;
// Independent oracle chooses the closest of adjacent mathematical floor/ceiling values.
function oracle(n: bigint, d: bigint): bigint {
  const low = n >= 0n ? n / d : -((-n + d - 1n) / d);
  const high = low + 1n;
  const lowDistance = n - low * d;
  const highDistance = high * d - n;
  return lowDistance < highDistance ? low : highDistance < lowDistance ? high : low % 2n === 0n ? low : high;
}
const cfg = { seed: SEED, numRuns: RUNS };

describe('money precision F09.S03.M03', () => {
  it('TEST-PS-074-09.T01 parses canonical signed amounts and rejects malformed/overflow values', () => {
    for (const text of ['0', '1', '-1', '9'.repeat(38), '-' + '9'.repeat(38)]) expect(unwrap(parseMinor(text)).toString()).toBe(text);
    for (const text of ['+1', '01', '1.0', '1e3', '-0', ' 1', '1 ', '', '--1']) expect(error(parseMinor(text))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(parseMinor('1' + '0'.repeat(38)))).toBe('COMMERCE_MONEY_OVERFLOW');
    expect(error(money('1', 'bad'))).toBe('COMMERCE_MONEY_INVALID');
    expect(unwrap(toWire(make('-123')))).toEqual({ amount: '-123', currency: 'CAD' });
  });
  it('parses decimal values exactly, requires explicit rounding and preserves tiny negative signs', () => {
    expect(unwrap(parseDecimal('12.34', 2))).toBe(1234n);
    expect(unwrap(parseDecimal('-0.000000000000000001', 18))).toBe(-1n);
    expect(unwrap(formatDecimal(make(-1n), 18))).toBe('-0.000000000000000001');
    expect(unwrap(formatDecimal(make(42n), 0))).toBe('42');
    expect(error(parseDecimal('1.001', 2))).toBe('COMMERCE_MONEY_PRECISION_LOSS');
    expect(unwrap(parseDecimal('1.005', 2, 'HALF_EVEN'))).toBe(100n);
    expect(unwrap(parseDecimal('1.015', 2, 'HALF_EVEN'))).toBe(102n);
    expect(unwrap(parseDecimal('-1.005', 2, 'HALF_EVEN'))).toBe(-100n);
    for (const text of ['.1', '01.2', '-0.00', '1.', '+1.2']) expect(error(parseDecimal(text, 2))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(parseDecimal('1.01', 2, 'FLOOR'))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(parseDecimal('1', 19))).toBe('COMMERCE_MONEY_INVALID');
  });
  it('TEST-PS-074-09.T02 validates rates, allocation weights and throws on currency mismatch', () => {
    const value = make(100n);
    for (const rate of [{ num: '0', den: '1' }, { num: '1', den: '0' }, { num: '01', den: '1' }, { num: '1'.repeat(41), den: '1' }]) {
      expect(error(convert(value, { base: 'CAD', quote: 'USD', rate }, 2, 2))).toBe('COMMERCE_MONEY_INVALID');
    }
    for (const weights of [[], [0, 0], [-1], [1.1], [Number.MAX_SAFE_INTEGER + 1], [10n ** 39n]]) expect(error(allocate(value, weights))).toBe('COMMERCE_MONEY_ALLOCATION_INVALID');
    for (const fn of [add, sub, cmp, capFee]) expect(() => fn(value, make(1n, 'USD'))).toThrow('Money currency mismatch');
    expect(() => sum([value, make(1n, 'USD')])).toThrow('Money currency mismatch');
    expect(() => convert(value, { base: 'USD', quote: 'CAD', rate: { num: '1', den: '1' } }, 2, 2)).toThrow('Money currency mismatch');
    expect(error(convert(value, { base: 'CAD', quote: 'USD', rate: { num: '1', den: '1' } }, 2, 2, 'FLOOR'))).toBe('COMMERCE_MONEY_INVALID');
  });
  it('TEST-PS-074-09.T03 exact fraction conversions use one rounding; seed=740016 runs=10000', () => {
    fc.assert(fc.property(fc.bigInt({ min: -(10n ** 18n), max: 10n ** 18n }), fc.bigInt({ min: 1n, max: 10n ** 12n }), fc.bigInt({ min: 1n, max: 10n ** 12n }), fc.integer({ min: 0, max: 18 }), fc.integer({ min: 0, max: 18 }), (a, n, d, db, dq) => {
      const expected = oracle(a * n * 10n ** BigInt(dq), d * 10n ** BigInt(db));
      const result = convert(make(a), { base: 'CAD', quote: 'USD', rate: { num: n.toString(), den: d.toString() } }, db, dq);
      if (expected >= 10n ** 38n || expected <= -(10n ** 38n)) expect(error(result)).toBe('COMMERCE_MONEY_OVERFLOW');
      else expect(unwrap(result).amount).toBe(expected);
    }), cfg);
  });
  it('TEST-PS-074-09.T04 conversion round-trip respects exact error bound; seed=740016 runs=10000', () => {
    fc.assert(fc.property(fc.bigInt({ min: -1000000000000n, max: 1000000000000n }), fc.bigInt({ min: 1n, max: 1000000n }), fc.bigInt({ min: 1n, max: 1000000n }), (a, n, d) => {
      const forward = unwrap(convert(make(a), { base: 'CAD', quote: 'USD', rate: { num: n.toString(), den: d.toString() } }, 2, 2));
      const back = unwrap(convert(forward, { base: 'USD', quote: 'CAD', rate: { num: d.toString(), den: n.toString() } }, 2, 2));
      const difference = back.amount > a ? back.amount - a : a - back.amount;
      expect(difference <= (d + n) / (2n * n)).toBe(true);
    }), cfg);
  });
  it('TEST-PS-074-09.T05 exact allocation sums and ideal-share bounds; seed=740016 runs=10000', () => {
    fc.assert(fc.property(fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }), fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 25 }).filter(ws => ws.some(w => w > 0)), (a, weights) => {
      const result = unwrap(allocate(make(a), weights));
      expect(result.parts.reduce((total, p) => total + p.amount, 0n)).toBe(a);
      const totalWeight = weights.reduce((s, w) => s + BigInt(w), 0n);
      result.parts.forEach((part, i) => {
        const difference = part.amount * totalWeight - a * BigInt(weights[i]!);
        expect((difference < 0n ? -difference : difference) < totalWeight).toBe(true);
        if (weights[i] === 0) expect(part.amount).toBe(0n);
      });
    }), cfg);
    expect(unwrap(splitEven(make(100n), 3)).parts.map(p => p.amount)).toEqual([34n, 33n, 33n]);
    expect(unwrap(splitEven(make(-100n), 3)).parts.map(p => p.amount)).toEqual([-34n, -33n, -33n]);
    expect(unwrap(allocate(make(2n), [0, 1, 1, 1])).remainderIndexes).toEqual([1, 2]);
  });
  it('TEST-PS-074-09.T06 half-even symmetry and ties; seed=740016 runs=10000', () => {
    fc.assert(fc.property(fc.bigInt({ min: -1000000000000n, max: 1000000000000n }), fc.bigInt({ min: 1n, max: 10000n }), (a, d) => {
      const quote = { base: 'CAD', quote: 'USD', rate: { num: '1', den: d.toString() } };
      expect(unwrap(convert(make(-a), quote, 0, 0)).amount).toBe(-unwrap(convert(make(a), quote, 0, 0)).amount);
      const tie = unwrap(convert(make(2n * a + 1n), { ...quote, rate: { num: '1', den: '2' } }, 0, 0)).amount;
      expect(tie % 2n).toBe(0n);
    }), cfg);
  });
  it('TEST-PS-074-09.T07 immutable arithmetic and final-result overflow handling', () => {
    const value = make(42n), other = make(8n);
    expect(Object.isFrozen(value)).toBe(true);
    expect(unwrap(add(value, other)).amount).toBe(50n);
    expect(unwrap(sub(value, other)).amount).toBe(34n);
    expect(unwrap(neg(value)).amount).toBe(-42n);
    expect(unwrap(cmp(value, other))).toBe(1);
    expect(unwrap(sign(value))).toBe(1);
    expect(unwrap(sign(make(-1n)))).toBe(-1);
    expect(unwrap(sign(make(0n)))).toBe(0);
    expect(error(sign({ amount: '1', currency: 'CAD' } as unknown as Money))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(sign({ amount: 1n, currency: 'bad' }))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(capFee(make(-1n), other))).toBe('COMMERCE_MONEY_INVALID');
    expect(error(formatDecimal(value, -1))).toBe('COMMERCE_MONEY_INVALID');
    expect(unwrap(sum([value, other])).amount).toBe(50n);
    expect(unwrap(sum([], 'CAD')).amount).toBe(0n);
    expect(error(sum([]))).toBe('COMMERCE_MONEY_INVALID');
    expect(unwrap(capFee(value, other)).amount).toBe(8n);
    expect(unwrap(percentBps(make(105n), 1000n)).amount).toBe(10n);
    expect(error(percentBps(value, -1n))).toBe('COMMERCE_MONEY_INVALID');
    const max = make('9'.repeat(38));
    expect(error(add(max, make(1n)))).toBe('COMMERCE_MONEY_OVERFLOW');
    expect(unwrap(sum([max, make(1n), make(-1n)]))).toEqual(max);
    const weights = Object.freeze([1, 2, 3]);
    expect(allocate(value, weights)).toEqual(allocate(value, weights));
    expect(value.amount).toBe(42n);
  });
  it('TEST-PS-074-09.T08 versioned shared vectors (331) match independently generated Fraction results', () => {
    const document = JSON.parse(readFileSync(new URL('../../../test/vectors/money.json', import.meta.url), 'utf8'));
    expect(document.format).toBe('classrup-money-vectors/v1');
    expect(document.vectors.length).toBeGreaterThanOrEqual(300);
    for (const v of document.vectors) {
      let actual: unknown;
      if (v.op === 'convert') actual = unwrap(convert(make(v.amount), { base: 'CAD', quote: 'USD', rate: { num: v.num, den: v.den } }, v.db, v.dq)).amount.toString();
      else if (v.op === 'percent') actual = unwrap(percentBps(make(v.amount), BigInt(v.bps))).amount.toString();
      else if (v.op === 'parse') actual = unwrap(parseDecimal(v.decimal, v.decimals, 'HALF_EVEN')).toString();
      else if (v.op === 'allocate') { const r = unwrap(allocate(make(v.amount), v.weights)); actual = { parts: r.parts.map(p => p.amount.toString()), remainderIndexes: r.remainderIndexes }; }
      else throw new Error('Unknown vector');
      expect(actual, v.id).toEqual(v.expected);
    }
  });
  it('TEST-PS-074-09.T09 error codes match contract without embedding amounts', () => {
    for (const code of Object.keys(moneyErrors.codes) as (keyof typeof moneyErrors.codes)[]) {
      const result = moneyErrors.make(code);
      expect(result.status).toBe(422);
      expect(result.retryable).toBe(false);
      expect(result.params).toEqual({});
    }
  });
  it('TEST-PS-074-09.T11 bounds pathological input before BigInt work', () => {
    expect(error(parseMinor('1'.repeat(5000)))).toBe('COMMERCE_MONEY_OVERFLOW');
    expect(error(parseDecimal('1'.repeat(5000), 2))).toBe('COMMERCE_MONEY_OVERFLOW');
    expect(error(allocate(make(100n), new Array(100000).fill(1)))).toBe('COMMERCE_MONEY_ALLOCATION_INVALID');
    expect(error(splitEven(make(1n), 1001))).toBe('COMMERCE_MONEY_ALLOCATION_INVALID');
  });
  it('TEST-PS-074-09.T10 TEST-PS-074-09.T14 exact-arithmetic source guard rejects float conversion', () => {
    const checker = fileURLToPath(new URL('../../../test/check_money_source.mjs', import.meta.url));
    expect(() => execFileSync(process.execPath, [checker])).not.toThrow();
    const directory = mkdtempSync(join(tmpdir(), 'classrup-money-lint-'));
    try {
      for (const source of ['parseFloat("1.2")', 'Number(amount)', 'Math.round(value)', 'Date.now()', 'fetch(url)', 'console.log(amount)', 'const ratio = 0.5']) {
        const path = join(directory, 'forbidden.ts'); writeFileSync(path, source);
        const result = spawnSync(process.execPath, [checker, path], { encoding: 'utf8' });
        expect(result.status).toBe(1);
        expect(result.stderr).not.toContain(source);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

});
