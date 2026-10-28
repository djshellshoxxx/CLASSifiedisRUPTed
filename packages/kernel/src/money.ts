/**
 * Money primitives (CTR-COM-001 basis; owner F09.S03 valuation, hosted in kernel to avoid
 * dependency cycles). ADR-0005/D03: integer minor units as bigint, explicit currency,
 * rational FX quotes with source/time/expiry, explicit rounding mode. No floating point.
 */
import { precondition, validationError } from './errors';

export interface CurrencyInfo {
  readonly code: string;
  /** Number of minor-unit decimal digits (USD 2, JPY 0, BTC 8, ETH 18). */
  readonly exponent: number;
  readonly kind: 'fiat' | 'crypto' | 'points';
}

const BUILTIN: readonly CurrencyInfo[] = [
  ['USD', 2], ['EUR', 2], ['GBP', 2], ['CAD', 2], ['AUD', 2], ['NZD', 2], ['CHF', 2], ['SEK', 2], ['NOK', 2], ['DKK', 2],
  ['PLN', 2], ['CZK', 2], ['MXN', 2], ['BRL', 2], ['INR', 2], ['ZAR', 2], ['SGD', 2], ['HKD', 2], ['CNY', 2], ['TRY', 2],
  ['JPY', 0], ['KRW', 0], ['ISK', 0], ['CLP', 0], ['VND', 0], ['KWD', 3], ['BHD', 3], ['JOD', 3], ['TND', 3], ['OMR', 3],
].map(([code, exponent]) => ({ code: code as string, exponent: exponent as number, kind: 'fiat' as const }));

const CRYPTO: readonly CurrencyInfo[] = [
  { code: 'BTC', exponent: 8, kind: 'crypto' },
  { code: 'ETH', exponent: 18, kind: 'crypto' },
  { code: 'USDC', exponent: 6, kind: 'crypto' },
  { code: 'XMR', exponent: 12, kind: 'crypto' },
  { code: 'LTC', exponent: 8, kind: 'crypto' },
];

export class CurrencyRegistry {
  readonly #byCode = new Map<string, CurrencyInfo>();
  constructor(entries: readonly CurrencyInfo[] = [...BUILTIN, ...CRYPTO]) {
    for (const e of entries) this.add(e);
  }
  add(info: CurrencyInfo): void {
    if (!/^[A-Z][A-Z0-9]{2,9}$/.test(info.code)) throw new TypeError(`invalid currency code ${info.code}`);
    if (!Number.isInteger(info.exponent) || info.exponent < 0 || info.exponent > 18) throw new TypeError('invalid exponent');
    this.#byCode.set(info.code, info);
  }
  get(code: string): CurrencyInfo {
    const c = this.#byCode.get(code);
    if (!c) throw validationError('MONEY.UNKNOWN_CURRENCY', 'unknown currency', { currency: code });
    return c;
  }
  has(code: string): boolean {
    return this.#byCode.has(code);
  }
  list(): CurrencyInfo[] {
    return [...this.#byCode.values()];
  }
}

export const currencies = new CurrencyRegistry();

export interface Money {
  readonly currency: string;
  readonly minor: bigint;
}

export type RoundingMode = 'half_even' | 'half_up' | 'half_down' | 'down' | 'up' | 'floor' | 'ceil';

export const money = (currency: string, minor: bigint | number | string): Money => {
  const m = typeof minor === 'bigint' ? minor : BigInt(minor);
  currencies.get(currency);
  return { currency, minor: m };
};

export const zero = (currency: string): Money => money(currency, 0n);

function sameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw validationError('MONEY.CURRENCY_MISMATCH', 'currency mismatch', { left: a.currency, right: b.currency });
  }
}

export const add = (a: Money, b: Money): Money => (sameCurrency(a, b), { currency: a.currency, minor: a.minor + b.minor });
export const subtract = (a: Money, b: Money): Money => (sameCurrency(a, b), { currency: a.currency, minor: a.minor - b.minor });
export const negate = (a: Money): Money => ({ currency: a.currency, minor: -a.minor });
export const compare = (a: Money, b: Money): -1 | 0 | 1 => (sameCurrency(a, b), a.minor < b.minor ? -1 : a.minor > b.minor ? 1 : 0);
export const equals = (a: Money, b: Money): boolean => a.currency === b.currency && a.minor === b.minor;
export const isZero = (a: Money): boolean => a.minor === 0n;
export const isNegative = (a: Money): boolean => a.minor < 0n;
export const sum = (currency: string, items: readonly Money[]): Money => items.reduce(add, zero(currency));
export const abs = (a: Money): Money => (a.minor < 0n ? negate(a) : a);

/** Integer division n/d with an explicit rounding mode. d must be non-zero. */
export function divRound(n: bigint, d: bigint, mode: RoundingMode): bigint {
  if (d === 0n) throw new RangeError('division by zero');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const q = n / d; // truncates toward zero
  const r = n % d;
  if (r === 0n) return q;
  const positive = n > 0n;
  const twice = (r < 0n ? -r : r) * 2n;
  const awayFromZero = positive ? q + 1n : q - 1n;
  switch (mode) {
    case 'down':
      return q;
    case 'up':
      return awayFromZero;
    case 'floor':
      return positive ? q : q - 1n;
    case 'ceil':
      return positive ? q + 1n : q;
    case 'half_up':
      return twice >= d ? awayFromZero : q;
    case 'half_down':
      return twice > d ? awayFromZero : q;
    case 'half_even':
      if (twice > d) return awayFromZero;
      if (twice < d) return q;
      return q % 2n === 0n ? q : awayFromZero;
  }
}

/** Multiply by a rational factor num/den with rounding. */
export function multiplyRatio(a: Money, num: bigint, den: bigint, mode: RoundingMode = 'half_even'): Money {
  return { currency: a.currency, minor: divRound(a.minor * num, den, mode) };
}

/**
 * Split `total` across weights using the largest-remainder method so parts always sum to total.
 * Ties go to the earliest index, making allocation deterministic.
 */
export function allocate(total: Money, weights: readonly bigint[]): Money[] {
  if (weights.length === 0) throw validationError('MONEY.ALLOCATE_EMPTY', 'no weights');
  if (weights.some((w) => w < 0n)) throw validationError('MONEY.ALLOCATE_NEGATIVE', 'negative weight');
  const wsum = weights.reduce((s, w) => s + w, 0n);
  if (wsum === 0n) throw validationError('MONEY.ALLOCATE_ZERO', 'weights sum to zero');
  const sign = total.minor < 0n ? -1n : 1n;
  const t = total.minor * sign;
  const base = weights.map((w) => (t * w) / wsum);
  const rema = weights.map((w, i) => ({ i, r: (t * w) % wsum }));
  let left = t - base.reduce((s, b) => s + b, 0n);
  rema.sort((x, y) => (x.r === y.r ? x.i - y.i : x.r > y.r ? -1 : 1));
  for (const { i } of rema) {
    if (left === 0n) break;
    base[i] = (base[i] as bigint) + 1n;
    left--;
  }
  return base.map((b) => ({ currency: total.currency, minor: b * sign }));
}

/**
 * Pinned FX quote: 1 major unit of `base` = rateNum/rateDen major units of `quote`.
 * Quotes are immutable evidence: source and timestamps are mandatory (D03).
 */
export interface FxQuote {
  readonly quoteId: string;
  readonly base: string;
  readonly quote: string;
  readonly rateNum: bigint;
  readonly rateDen: bigint;
  readonly source: string;
  readonly asOf: number;
  readonly expiresAt: number;
}

export function convert(amount: Money, q: FxQuote, now: number, mode: RoundingMode = 'half_even'): Money {
  if (amount.currency !== q.base) throw validationError('MONEY.QUOTE_MISMATCH', 'quote base does not match amount', { base: q.base, currency: amount.currency });
  if (q.rateNum <= 0n || q.rateDen <= 0n) throw validationError('MONEY.QUOTE_INVALID', 'quote rate must be positive');
  if (now >= q.expiresAt) throw precondition('MONEY.QUOTE_EXPIRED', 'FX quote expired', { quoteId: q.quoteId });
  if (now < q.asOf) throw precondition('MONEY.QUOTE_NOT_YET_VALID', 'FX quote from the future', { quoteId: q.quoteId });
  const eb = currencies.get(q.base).exponent;
  const eq = currencies.get(q.quote).exponent;
  // minor_q = minor_b * rate * 10^eq / 10^eb
  const num = amount.minor * q.rateNum * 10n ** BigInt(eq);
  const den = q.rateDen * 10n ** BigInt(eb);
  return { currency: q.quote, minor: divRound(num, den, mode) };
}

/** Parse a decimal major-unit string ("12.34") into Money without floating point. */
export function parseMajor(currency: string, text: string): Money {
  const { exponent } = currencies.get(currency);
  const m = /^(-)?(\d{1,24})(?:\.(\d+))?$/.exec(text.trim());
  if (!m) throw validationError('MONEY.INVALID_AMOUNT', 'invalid amount format');
  const frac = m[3] ?? '';
  if (frac.length > exponent) throw validationError('MONEY.TOO_PRECISE', 'too many decimal places', { currency, max: exponent });
  const minor = BigInt((m[2] as string) + frac.padEnd(exponent, '0'));
  return { currency, minor: m[1] ? -minor : minor };
}

/** Format as plain decimal major-units string ("12.34"); locale formatting is F14's job. */
export function formatMajor(a: Money): string {
  const { exponent } = currencies.get(a.currency);
  const neg = a.minor < 0n;
  const digits = (neg ? -a.minor : a.minor).toString().padStart(exponent + 1, '0');
  const whole = exponent === 0 ? digits : digits.slice(0, -exponent);
  const frac = exponent === 0 ? '' : `.${digits.slice(-exponent)}`;
  return `${neg ? '-' : ''}${whole}${frac}`;
}

/** JSON wire form: minor as decimal string. */
export interface MoneyJson {
  currency: string;
  minor: string;
}
export const moneyToJson = (a: Money): MoneyJson => ({ currency: a.currency, minor: a.minor.toString() });
export const moneyFromJson = (j: MoneyJson): Money => {
  if (!/^-?\d{1,40}$/.test(j.minor)) throw validationError('MONEY.INVALID_AMOUNT', 'invalid minor amount');
  return money(j.currency, BigInt(j.minor));
};
