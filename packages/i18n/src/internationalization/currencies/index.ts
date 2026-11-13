// F14.S02.M02 (PS-112) Currency display: exact string-based formatting and parsing of CTR-MNY-001 money.
// Headless library: no commands, queries or events, no I/O, no state except a bounded Intl.NumberFormat cache.
// Amounts are minor-unit decimal strings and are never converted to a JavaScript Number (the BigInt path only
// formats the whole as a BigInt and substitutes localized digits from the exact fraction).
import { defineErrors, err, ok, z, type AppError, type Result } from '@classrup/kernel';

export const currencyErrors = defineErrors({
  I18N_MONEY_INVALID: { status: 422, retryable: false },
  I18N_MONEY_EXPONENT_INVALID: { status: 422, retryable: false },
  I18N_MONEY_PRECISION: { status: 422, retryable: false },
  I18N_MONEY_TOO_LARGE: { status: 422, retryable: false },
  I18N_QUOTE_LABEL_INVALID: { status: 422, retryable: false },
});
export type CurrencyErrorCode = keyof typeof currencyErrors.codes;
const fail = (code: CurrencyErrorCode, reason: string): Result<never> => err(currencyErrors.make(code, { params: { reason } }) as AppError);

/** CurrencySpec is supplied by the caller from the registry (F09.S03.M01). */
export interface CurrencySpec { readonly code: string; readonly exponent: number; readonly kind: 'iso' | 'crypto' | (string & {}) }
export interface MoneyValue { readonly amount: string; readonly currency: string }
export type DisplayMode = 'symbol' | 'code' | 'name';
export interface MoneyPart { readonly type: 'sign' | 'currency' | 'integer' | 'group' | 'decimal' | 'fraction' | 'literal'; readonly value: string }
export interface FormatOptions {
  readonly display?: DisplayMode;
  readonly trimZeros?: boolean;
  /** 'auto' uses Intl decimal-string support when the engine has it, else the BigInt part substitution; the others force one path (self-test, tests). */
  readonly engine?: 'auto' | 'decimal' | 'bigint';
  /** Dev-only hook for i18n.money.fallback {currency, reason}; never receives amounts. */
  readonly onFallback?: (info: { readonly currency: string; readonly reason: string }) => void;
}
export interface QuoteLabel { readonly source?: string; readonly asOf?: string; readonly expiresAt?: string }
export type Translate = (key: string, params: Readonly<Record<string, string | number>>) => string;
export interface ApproxOptions { readonly timeZone: string; /** Injected clock, epoch ms. */ readonly now: number; readonly translate: Translate; readonly display?: DisplayMode; readonly onFallback?: FormatOptions['onFallback'] }

const FSI = '⁨', PDI = '⁩';
const BIDI = /[؜‎‏‪-‮⁦-⁩]/g;
const AMOUNT_RE = /^(?:0|-?[1-9][0-9]{0,77})$/;
const OLD_QUOTE_MS = 24 * 3_600_000;
const MAX_PARSE_CHARS = 40;
const MAX_PARSE_DIGITS = 30;

// A price list usually shares one locale. Keep just the most recent locale
// analysis, which can be reused for formatting, parsing and quote labels.
let lastLocale: { input: string; tag: string; rtl: boolean } | undefined;
function localeInfo(input: string) {
  if (lastLocale && lastLocale.input === input) return lastLocale;
  let tag = 'en';
  let rtl = false;
  try {
    tag = Intl.getCanonicalLocales(input)[0] ?? 'en';
    const locale = new Intl.Locale(tag);
    const script = locale.script ?? locale.maximize().script;
    rtl = script === 'Arab' || script === 'Hebr' || script === 'Thaa' || script === 'Syrc';
  } catch { /* Use English for malformed locale tags. */ }
  lastLocale = { input, tag, rtl };
  return lastLocale;
}

// Bounded cache of at most 64 Intl.NumberFormat instances.
const cache = new Map<string, Intl.NumberFormat>();
function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${options.style}|${options.currency ?? ''}|${options.currencyDisplay ?? ''}|${options.minimumFractionDigits}|${options.maximumFractionDigits}|${options.useGrouping ?? ''}`;
  let nf = cache.get(key);
  if (nf === undefined) {
    nf = new Intl.NumberFormat(locale, options);
    if (cache.size >= 64) cache.delete(cache.keys().next().value as string);
    cache.set(key, nf);
  }
  return nf;
}
const supportsDecimalStrings = (nf: Intl.NumberFormat): boolean => typeof (nf.resolvedOptions() as { roundingMode?: unknown }).roundingMode === 'string';

interface Split { readonly neg: boolean; readonly whole: string; readonly frac: string }
function split(money: MoneyValue, spec: CurrencySpec): Result<Split> {
  if (typeof spec.exponent !== 'number' || !Number.isInteger(spec.exponent) || spec.exponent < 0 || spec.exponent > 18) return fail('I18N_MONEY_EXPONENT_INVALID', 'exponent');
  if (typeof money.amount !== 'string' || !AMOUNT_RE.test(money.amount)) return fail('I18N_MONEY_INVALID', 'amount');
  if (money.currency !== spec.code) return fail('I18N_MONEY_INVALID', 'currency');
  const neg = money.amount.startsWith('-');
  const digits = neg ? money.amount.slice(1) : money.amount;
  const e = spec.exponent;
  const padded = digits.length <= e ? digits.padStart(e + 1, '0') : digits;
  return ok({ neg, whole: padded.slice(0, padded.length - e), frac: padded.slice(padded.length - e) });
}

const digitMaps = new Map<string, string[]>();
function localDigits(locale: string): string[] {
  let m = digitMaps.get(locale);
  if (!m) { const nf = new Intl.NumberFormat(locale, { useGrouping: false }); m = Array.from({ length: 10 }, (_, d) => nf.format(d)); digitMaps.set(locale, m); }
  return m;
}
const mapType = (t: string): MoneyPart['type'] => t === 'minusSign' || t === 'plusSign' ? 'sign' : t === 'integer' || t === 'group' || t === 'decimal' || t === 'fraction' || t === 'currency' ? t : 'literal';

function numberParts(s: Split, locale: string, nf: Intl.NumberFormat, options: FormatOptions): Intl.NumberFormatPart[] {
  const engine = options.engine ?? 'auto';
  const decimalStrings = supportsDecimalStrings(nf);
  const decimal = `${s.neg ? '-' : ''}${s.whole}${s.frac ? `.${s.frac}` : ''}`;
  if (engine === 'decimal' || (engine === 'auto' && decimalStrings)) return nf.formatToParts(decimal as unknown as number);

  const whole = BigInt(s.whole);
  // BigInt has no negative zero. Preserve the minus for negative amounts below one major unit.
  const signedWhole = s.neg ? (whole === 0n ? -0 : -whole) : whole;
  const parts = nf.formatToParts(signedWhole);
  if (!/[1-9]/.test(s.frac)) return parts;

  const digits = localDigits(locale);
  const fraction = [...s.frac].map(d => digits[d.charCodeAt(0) - 48]).join('');
  if (options.display === 'name' && decimalStrings) {
    // Forced BigInt mode on a modern engine: retain the native fractional plural pattern,
    // including any localized literals, while formatting the numeric parts through BigInt.
    const integers = parts.filter(p => p.type === 'integer' || p.type === 'group');
    return nf.formatToParts(decimal as unknown as number).map(p => {
      if (p.type === 'integer' || p.type === 'group') return integers.shift()!;
      return p.type === 'fraction' ? { ...p, value: fraction } : p;
    });
  }
  return parts.map(p => p.type === 'fraction' ? { ...p, value: fraction } : p);
}

type Layout = 'currency' | 'decimal-code';
function build(money: MoneyValue, spec: CurrencySpec, locale: string, options: FormatOptions, layout: Layout): Result<MoneyPart[]> {
  const sp = split(money, spec);
  if (!sp.ok) return sp;
  const s = sp.value;
  const { tag: loc, rtl } = localeInfo(locale);
  const frac = options.trimZeros ? s.frac.replace(/0+$/, '') : s.frac;
  const fd = frac.length;
  const base: Intl.NumberFormatOptions = { minimumFractionDigits: fd, maximumFractionDigits: fd, useGrouping: true };
  let parts: MoneyPart[];
  let usedCurrencyStyle = false;
  if (layout === 'currency' && spec.kind === 'iso' && /^[A-Z]{3}$/.test(spec.code)) {
    try {
      let nf = formatter(loc, { ...base, style: 'currency', currency: spec.code, currencyDisplay: options.display ?? 'symbol' });
      // With visible fraction digits, en/de plurals use the same form irrespective of the
      // fraction, and French uses the integer part. Other locales can depend on its value.
      if (options.display === 'name' && options.engine !== 'decimal' && /[1-9]/.test(frac)
          && !supportsDecimalStrings(nf) && !['en', 'de', 'fr'].includes(new Intl.Locale(loc).language)) {
        options.onFallback?.({ currency: spec.code, reason: 'fractional-currency-name-unsupported' });
        nf = formatter(loc, { ...base, style: 'currency', currency: spec.code, currencyDisplay: 'code' });
      }
      parts = numberParts({ ...s, frac }, loc, nf, options).map(p => ({ type: mapType(p.type), value: p.value }));
      usedCurrencyStyle = true;
    } catch { options.onFallback?.({ currency: spec.code, reason: 'currency-style-unsupported' }); parts = []; }
  } else { parts = []; if (layout === 'currency' && spec.kind === 'iso') options.onFallback?.({ currency: spec.code, reason: 'malformed-currency-code' }); }
  if (!usedCurrencyStyle) {
    const nf = formatter(loc, { ...base, style: 'decimal' });
    parts = numberParts({ ...s, frac }, loc, nf, options).map(p => ({ type: mapType(p.type), value: p.value }));
    parts.push({ type: 'literal', value: ' ' }, { type: 'currency', value: spec.code });
  }
  if (rtl) { parts.unshift({ type: 'literal', value: FSI }); parts.push({ type: 'literal', value: PDI }); }
  return ok(parts);
}
const join = (r: Result<MoneyPart[]>): Result<string> => r.ok ? ok(r.value.map(p => p.value).join('')) : r;

/** Locale-aware, digit-exact, unrounded display of a money value. Invalid input yields an explicit error, never a string. */
export function formatMoney(money: MoneyValue, spec: CurrencySpec, locale: string, options: FormatOptions = {}): Result<string> {
  return join(build(money, spec, locale, options, 'currency'));
}
/** Same output as formatMoney, split into typed parts so layouts can style currency and fraction. */
export function formatMoneyParts(money: MoneyValue, spec: CurrencySpec, locale: string, options: FormatOptions = {}): Result<MoneyPart[]> {
  return build(money, spec, locale, options, 'currency');
}

const quoteInstant = z.iso.datetime({ offset: true });

function checkInstant(asOf: unknown): number | undefined {
  if (typeof asOf !== 'string') return undefined;
  const timestamp = asOf.toUpperCase();
  return quoteInstant.safeParse(timestamp).success ? Date.parse(timestamp) : undefined;
}
/** Approximate (converted) value: always the marker, the code, and either source plus time or the details-unavailable text. */
export function formatApprox(money: MoneyValue, spec: CurrencySpec, quote: QuoteLabel, locale: string, options: ApproxOptions): Result<string> {
  const amount = build(money, spec, locale, { ...(options.onFallback ? { onFallback: options.onFallback } : {}) }, 'decimal-code');
  if (!amount.ok) return amount;
  const amountText = amount.value.map(p => p.value).join('');
  const rawSource = typeof quote.source === 'string' ? quote.source : undefined;
  if (quote.source !== undefined && rawSource === undefined) return fail('I18N_QUOTE_LABEL_INVALID', 'source');
  const cleanSource = rawSource?.replace(BIDI, '').trim() ?? '';
  if (cleanSource === '') return ok(options.translate('money.approx_unavailable', { amount: amountText }));
  if ([...cleanSource].length > 80 || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(cleanSource)) return fail('I18N_QUOTE_LABEL_INVALID', 'source');
  const asOf = checkInstant(quote.asOf);
  if (asOf === undefined || !Number.isFinite(options.now)) return fail('I18N_QUOTE_LABEL_INVALID', 'asOf');
  let time: string;
  try { time = new Intl.DateTimeFormat(localeInfo(locale).tag, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: options.timeZone }).format(asOf); } catch { return fail('I18N_QUOTE_LABEL_INVALID', 'timeZone'); }
  const source = cleanSource !== rawSource || localeInfo(locale).rtl ? `${FSI}${cleanSource}${PDI}` : cleanSource;
  const old = options.now - asOf > OLD_QUOTE_MS;
  return ok(options.translate(old ? 'money.approx_old' : 'money.approx', { amount: amountText, source, time }));
}

/** Spoken-friendly currency name for assistive technology, plural-aware for ISO codes; other codes are returned as written. */
export function currencyName(code: string, locale: string, count: number): string {
  if (!/^[A-Z]{3}$/.test(code)) return code;
  try {
    const nf = formatter(localeInfo(locale).tag, { style: 'currency', currency: code, currencyDisplay: 'name', minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true });
    return nf.formatToParts(Number.isSafeInteger(count) && count >= 0 ? count : 2).find(p => p.type === 'currency')?.value ?? code;
  } catch { return code; }
}

interface Separators {
  readonly decimal: string;
  readonly group: string | undefined;
  readonly rightmostGroupWidth: number;
  readonly repeatedGroupWidth: number;
  readonly digits: Map<string, string>;
  readonly minus: string;
}
const sepCache = new Map<string, Separators>();
function separators(locale: string): Separators {
  let s = sepCache.get(locale);
  if (!s) {
    const ps = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).formatToParts(-1234567890123.5);
    const widths = ps.filter(part => part.type === 'integer').map(part => [...part.value].length);
    const digits = new Map<string, string>();
    localDigits(locale).forEach((d, i) => digits.set(d, String(i)));
    s = {
      decimal: ps.find(p => p.type === 'decimal')?.value ?? '.',
      group: ps.find(p => p.type === 'group')?.value,
      rightmostGroupWidth: widths.at(-1) ?? 0,
      repeatedGroupWidth: widths.at(-2) ?? 0,
      digits,
      minus: ps.find(p => p.type === 'minusSign')?.value ?? '-',
    };
    sepCache.set(locale, s);
  }
  return s;
}
const GROUPING_SPACE = /^[ \u00a0\u202f]$/;

/** Parses typed text to a minor-unit string. Only the locale decimal separator is accepted; lossy or ambiguous input is rejected, never rounded. */
export function parseMoneyInput(text: string, spec: CurrencySpec, locale: string, options: { readonly max?: string | bigint } = {}): Result<string> {
  if (typeof spec.exponent !== 'number' || !Number.isInteger(spec.exponent) || spec.exponent < 0 || spec.exponent > 18) return fail('I18N_MONEY_EXPONENT_INVALID', 'exponent');
  if (typeof text !== 'string') return fail('I18N_MONEY_INVALID', 'text');
  // At most two UTF-16 units per code point; avoid allocating from an oversized input.
  if (text.length > MAX_PARSE_CHARS && (text.length > 2 * MAX_PARSE_CHARS || [...text].length > MAX_PARSE_CHARS)) {
    return fail('I18N_MONEY_TOO_LARGE', 'length');
  }
  const sep = separators(localeInfo(locale).tag);
  const groupIsSpace = sep.group !== undefined && GROUPING_SPACE.test(sep.group);
  const input = text.trim();
  let neg = false, seenDecimal = false, hasGroup = false;
  let whole = '', frac = '', run = 0;
  let i = 0;
  const chars = [...input];
  if (chars[0] === '-' || chars[0] === '−' || chars[0] === sep.minus) { neg = true; i = 1; }
  for (; i < chars.length; i++) {
    const c = chars[i] as string;
    const digit = /^[0-9]$/.test(c) ? c : sep.digits.get(c);
    if (digit !== undefined) { if (seenDecimal) frac += digit; else { whole += digit; run++; } continue; }
    if (c === sep.decimal) {
      if (seenDecimal) return fail('I18N_MONEY_PRECISION', 'repeated decimal separator');
      seenDecimal = true;
      continue;
    }
    if (c === sep.group || (groupIsSpace && GROUPING_SPACE.test(c))) {
      if (seenDecimal) return fail('I18N_MONEY_PRECISION', 'grouping after decimal');
      if (run === 0 || run > sep.repeatedGroupWidth || (hasGroup && run !== sep.repeatedGroupWidth)) {
        return fail('I18N_MONEY_PRECISION', 'malformed grouping');
      }
      hasGroup = true; run = 0;
      continue;
    }
    if (/[.,'’]/.test(c)) return fail('I18N_MONEY_PRECISION', 'mixed separators');
    return fail('I18N_MONEY_INVALID', 'character');
  }
  if (whole === '' && frac === '') return fail('I18N_MONEY_INVALID', 'no digits');
  if (hasGroup && run !== sep.rightmostGroupWidth) return fail('I18N_MONEY_PRECISION', 'malformed grouping');
  if (hasGroup && !seenDecimal && spec.exponent > 0) return fail('I18N_MONEY_PRECISION', 'ambiguous grouping without decimal part');
  if (frac.length > spec.exponent) return fail('I18N_MONEY_PRECISION', 'too many fraction digits');
  const minor = (whole + frac.padEnd(spec.exponent, '0')).replace(/^0+/, '') || '0';
  if (minor.length > MAX_PARSE_DIGITS) return fail('I18N_MONEY_TOO_LARGE', 'digits');
  const signed = neg && minor !== '0' ? `-${minor}` : minor;
  if (options.max !== undefined && BigInt(signed) > BigInt(options.max)) return fail('I18N_MONEY_TOO_LARGE', 'max');
  return ok(signed);
}

/** Startup self-test: the decimal-string path and the BigInt substitution path must agree on 20 samples (budget 10 ms). */
export function runFormatSelfTest(locale = 'en'): { readonly ok: boolean; readonly checked: number; readonly mismatches: readonly string[] } {
  const specs: CurrencySpec[] = [
    { code: 'USD', exponent: 2, kind: 'iso' }, { code: 'JPY', exponent: 0, kind: 'iso' }, { code: 'KWD', exponent: 3, kind: 'iso' }, { code: 'BTC', exponent: 8, kind: 'crypto' },
  ];
  const amounts = ['0', '5', '-5', '4500', '-250', '9007199254740993', '12345678901234567890', '-1000000', '99', '-123456789012345678901234567890'];
  const mismatches: string[] = [];
  let checked = 0;
  for (const [i, amount] of amounts.entries()) {
    for (const spec of [specs[i % 4] as CurrencySpec, specs[(i + 1) % 4] as CurrencySpec]) {
      const m = { amount, currency: spec.code };
      const a = formatMoney(m, spec, locale, { engine: 'decimal' });
      const b = formatMoney(m, spec, locale, { engine: 'bigint' });
      checked++;
      if (!a.ok || !b.ok || a.value !== b.value) mismatches.push(`${spec.code} ${amount}`);
    }
  }
  return { ok: mismatches.length === 0, checked, mismatches };
}
