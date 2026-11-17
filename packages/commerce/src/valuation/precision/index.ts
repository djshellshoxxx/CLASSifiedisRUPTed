// F09.S03.M03: pure, exact minor-unit arithmetic (CTR-MNY-001).
import { defineErrors, err, ok, type Result } from '@classrup/kernel/errors';

export interface Money { readonly amount: bigint; readonly currency: string }
export interface MoneyWire { readonly amount: string; readonly currency: string }
export interface Rational { readonly num: string; readonly den: string }
export interface ConversionQuote { readonly base: string; readonly quote: string; readonly rate: Rational }
export type RoundingMode = 'HALF_EVEN' | 'FLOOR';
export interface AllocationResult { readonly parts: readonly Money[]; readonly remainderIndexes: readonly number[] }

export const moneyErrors = defineErrors({
  COMMERCE_MONEY_INVALID: { status: 422, retryable: false },
  COMMERCE_MONEY_ALLOCATION_INVALID: { status: 422, retryable: false },
  COMMERCE_MONEY_PRECISION_LOSS: { status: 422, retryable: false },
  COMMERCE_MONEY_OVERFLOW: { status: 422, retryable: false },
});
type Code = keyof typeof moneyErrors.codes;
const fail = (code: Code): Result<never> => err(moneyErrors.make(code));
const MAX = 10n ** 38n - 1n;
const CURRENCY = /^[A-Z][A-Z0-9]{2,9}$/;
const abs = (n: bigint): bigint => n < 0n ? -n : n;
const bounded = (n: bigint): Result<bigint> => abs(n) > MAX ? fail('COMMERCE_MONEY_OVERFLOW') : ok(n);
const exponent = (n: number): boolean => Number.isInteger(n) && n >= 0 && n <= 18;
const halfEven = (mode: RoundingMode): boolean => mode === 'HALF_EVEN';

/** Validate length before BigInt conversion; never put amounts in an error. */
export function parseMinor(value: string): Result<bigint> {
  if (typeof value !== 'string') return fail('COMMERCE_MONEY_INVALID');
  if (value.length > 39) return fail('COMMERCE_MONEY_OVERFLOW');
  if (!/^(?:0|-?[1-9][0-9]*)$/.test(value)) return fail('COMMERCE_MONEY_INVALID');
  return bounded(BigInt(value));
}
/** Currency membership is checked by the owning registry; this validates its code grammar. */
export function money(amount: string | bigint, currency: string): Result<Money> {
  if (typeof currency !== 'string' || !CURRENCY.test(currency)) return fail('COMMERCE_MONEY_INVALID');
  const parsed = typeof amount === 'bigint' ? bounded(amount) : parseMinor(amount);
  return parsed.ok ? ok(Object.freeze({ amount: parsed.value, currency })) : parsed;
}
export function toWire(value: Money): Result<MoneyWire> {
  const parsed = checked(value);
  return parsed.ok ? ok(Object.freeze({ amount: value.amount.toString(), currency: value.currency })) : parsed;
}
function checked(value: Money): Result<Money> {
  return value && typeof value === 'object' && typeof value.amount === 'bigint'
    ? money(value.amount, value.currency) : fail('COMMERCE_MONEY_INVALID');
}
function same(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new TypeError('Money currency mismatch');
}
function rounded(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  const whole = numerator / denominator;
  const remainder = numerator % denominator;
  if (mode === 'FLOOR') return remainder < 0n ? whole - 1n : whole;
  const twice = abs(remainder) * 2n;
  return twice > denominator || (twice === denominator && abs(whole) % 2n === 1n)
    ? whole + (numerator < 0n ? -1n : 1n) : whole;
}

/** Canonical, locale-independent major units. Excess digits need explicit HALF_EVEN. */
export function parseDecimal(value: string, decimals: number, mode?: RoundingMode): Result<bigint> {
  if (!exponent(decimals) || (mode !== undefined && !halfEven(mode)) || typeof value !== 'string') return fail('COMMERCE_MONEY_INVALID');
  if (value.length > 80) return fail('COMMERCE_MONEY_OVERFLOW');
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) return fail('COMMERCE_MONEY_INVALID');
  const negative = value.startsWith('-');
  const [whole = '', fraction = ''] = (negative ? value.slice(1) : value).split('.');
  const digits = BigInt(whole + fraction);
  if (negative && digits === 0n) return fail('COMMERCE_MONEY_INVALID');
  if (fraction.length > decimals && mode === undefined) return fail('COMMERCE_MONEY_PRECISION_LOSS');
  const signed = negative ? -digits : digits;
  return bounded(fraction.length <= decimals ? signed * 10n ** BigInt(decimals - fraction.length)
    : rounded(signed, 10n ** BigInt(fraction.length - decimals), 'HALF_EVEN'));
}
export function formatDecimal(value: Money, decimals: number): Result<string> {
  const parsed = checked(value); if (!parsed.ok) return parsed;
  if (!exponent(decimals)) return fail('COMMERCE_MONEY_INVALID');
  const digits = abs(value.amount).toString().padStart(decimals + 1, '0');
  return ok(`${value.amount < 0n ? '-' : ''}${decimals === 0 ? digits : `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`}`);
}
function binary(a: Money, b: Money, subtract: boolean): Result<Money> {
  const left = checked(a); if (!left.ok) return left;
  const right = checked(b); if (!right.ok) return right;
  same(a, b);
  return money(subtract ? a.amount - b.amount : a.amount + b.amount, a.currency);
}
export const add = (a: Money, b: Money): Result<Money> => binary(a, b, false);
export const sub = (a: Money, b: Money): Result<Money> => binary(a, b, true);
export function neg(value: Money): Result<Money> {
  const parsed = checked(value); return parsed.ok ? money(-value.amount, value.currency) : parsed;
}
export function sign(value: Money): Result<-1 | 0 | 1> {
  const parsed = checked(value); if (!parsed.ok) return parsed;
  return ok(value.amount < 0n ? -1 : value.amount > 0n ? 1 : 0);
}
export function cmp(a: Money, b: Money): Result<-1 | 0 | 1> {
  const left = checked(a); if (!left.ok) return left;
  const right = checked(b); if (!right.ok) return right;
  same(a, b);
  return ok(a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0);
}
/** Empty sum requires an explicit currency, avoiding an invented unit. */
export function sum(values: readonly Money[], currency?: string): Result<Money> {
  if (!Array.isArray(values) || values.length > 1000) return fail('COMMERCE_MONEY_INVALID');
  const initial = money(0n, currency ?? values[0]?.currency ?? ''); if (!initial.ok) return initial;
  let total = 0n;
  for (const value of values) {
    const parsed = checked(value); if (!parsed.ok) return parsed;
    same(initial.value, value);
    total += value.amount;
  }
  return money(total, initial.value.currency);
}
function rate(value: Rational): Result<{ num: bigint; den: bigint }> {
  if (!value || typeof value !== 'object' || typeof value.num !== 'string' || typeof value.den !== 'string'
    || !/^[1-9][0-9]{0,39}$/.test(value.num) || !/^[1-9][0-9]{0,39}$/.test(value.den)) return fail('COMMERCE_MONEY_INVALID');
  return ok({ num: BigInt(value.num), den: BigInt(value.den) });
}
/** Caller authenticates, pins and checks quote expiry; this pure function never reads a clock. */
export function convert(value: Money, quote: ConversionQuote, dbExp: number, dqExp: number, mode: RoundingMode = 'HALF_EVEN'): Result<Money> {
  const parsed = checked(value); if (!parsed.ok) return parsed;
  if (!quote || !exponent(dbExp) || !exponent(dqExp) || !halfEven(mode)
    || typeof quote.base !== 'string' || !CURRENCY.test(quote.base)
    || typeof quote.quote !== 'string' || !CURRENCY.test(quote.quote)) return fail('COMMERCE_MONEY_INVALID');
  if (value.currency !== quote.base) throw new TypeError('Money currency mismatch');
  const rational = rate(quote.rate); if (!rational.ok) return rational;
  return money(rounded(value.amount * rational.value.num * 10n ** BigInt(dqExp), rational.value.den * 10n ** BigInt(dbExp), mode), quote.quote);
}
/** Basis points must be exact integers. FLOOR is reserved for capFee, not percentages. */
export function percentBps(value: Money, bps: bigint, mode: RoundingMode = 'HALF_EVEN'): Result<Money> {
  const parsed = checked(value); if (!parsed.ok) return parsed;
  if (typeof bps !== 'bigint' || bps < 0n || bps > MAX || !halfEven(mode)) return fail('COMMERCE_MONEY_INVALID');
  return money(rounded(value.amount * bps, 10000n, mode), value.currency);
}
/** A minor-unit fee cap cannot round upward; both operands are already integral. */
export function capFee(value: Money, cap: Money): Result<Money> {
  const left = checked(value); if (!left.ok) return left;
  const right = checked(cap); if (!right.ok) return right;
  same(value, cap);
  if (value.amount < 0n || cap.amount < 0n) return fail('COMMERCE_MONEY_INVALID');
  return money(value.amount < cap.amount ? value.amount : cap.amount, value.currency);
}
/** Hamilton allocation of the absolute total; signed amounts are exact negations. */
export function allocate(value: Money, weights: readonly (number | bigint)[]): Result<AllocationResult> {
  const parsed = checked(value); if (!parsed.ok) return parsed;
  if (!Array.isArray(weights) || weights.length === 0 || weights.length > 1000) return fail('COMMERCE_MONEY_ALLOCATION_INVALID');
  const exact: bigint[] = [];
  for (const weight of weights) {
    if (typeof weight !== 'bigint' && (typeof weight !== 'number' || !Number.isSafeInteger(weight))) return fail('COMMERCE_MONEY_ALLOCATION_INVALID');
    const n = BigInt(weight);
    if (n < 0n || n > MAX) return fail('COMMERCE_MONEY_ALLOCATION_INVALID');
    exact.push(n);
  }
  const totalWeight = exact.reduce((a, b) => a + b, 0n);
  if (totalWeight === 0n) return fail('COMMERCE_MONEY_ALLOCATION_INVALID');
  const magnitude = abs(value.amount);
  const shares = exact.map((weight, index) => {
    const numerator = magnitude * weight;
    return { index, amount: numerator / totalWeight, remainder: numerator % totalWeight };
  });
  let remaining = magnitude - shares.reduce((total, part) => total + part.amount, 0n);
  const order = shares.slice().sort((a, b) => a.remainder > b.remainder ? -1 : a.remainder < b.remainder ? 1 : a.index - b.index);
  const remainderIndexes: number[] = [];
  for (const share of order) {
    if (remaining === 0n) break;
    share.amount++;
    remainderIndexes.push(share.index);
    remaining--;
  }
  const sign = value.amount < 0n ? -1n : 1n;
  return ok(Object.freeze({ parts: Object.freeze(shares.map(part => Object.freeze({ amount: part.amount * sign, currency: value.currency }))), remainderIndexes: Object.freeze(remainderIndexes) }));
}
export function splitEven(value: Money, n: number): Result<AllocationResult> {
  if (!Number.isInteger(n) || n < 1 || n > 1000) return fail('COMMERCE_MONEY_ALLOCATION_INVALID');
  return allocate(value, Array.from({ length: n }, () => 1n));
}
