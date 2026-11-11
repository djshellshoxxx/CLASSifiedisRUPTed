import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lib from './index.ts';
import { currencyName, formatApprox, formatMoney, formatMoneyParts, parseMoneyInput, runFormatSelfTest, type CurrencySpec, type MoneyValue } from './index.ts';
import { createI18n, enCatalog, shippedCatalogs } from '../languages/index.ts';

const spec = (code: string, exponent: number, kind: CurrencySpec['kind'] = 'iso'): CurrencySpec => ({ code, exponent, kind });
const EUR = spec('EUR', 2), USD = spec('USD', 2), JPY = spec('JPY', 0), KWD = spec('KWD', 3), BTC = spec('BTC', 8, 'crypto'), ETH = spec('ETH', 18, 'crypto'), USDC = spec('USDC', 6, 'crypto');
const SPECS = [EUR, USD, JPY, KWD, BTC, ETH, USDC];
const LOCALES = ['en', 'de', 'fr', 'es', 'ar-XB'];
const m = (amount: string, s: CurrencySpec): MoneyValue => ({ amount, currency: s.code });
const norm = (s: string) => s.replace(/[\s  ]/g, ' ');
const fmt = (amount: string, s: CurrencySpec, locale: string, o: Parameters<typeof formatMoney>[3] = {}) => {
  const r = formatMoney(m(amount, s), s, locale, o);
  if (!r.ok) throw new Error(r.error.code);
  return norm(r.value);
};
const code = (r: { ok: boolean; error?: { code: string } }) => (r.ok ? 'ok' : r.error?.code);
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const translateFor = (locale: string) => {
  const i18n = createI18n({ en: enCatalog, supported: ['en', 'de'], loadCatalog: async l => shippedCatalogs[l] });
  return i18n.setLocale(locale).then(() => (key: string, params: Readonly<Record<string, string | number>>) => i18n.t(key, params));
};

describe('formatMoney goldens', () => {
  it('TEST-PS-112-09.T01 golden strings for the fixture amounts and specs in en, de, fr and es', () => {
    const goldens: Array<[string, CurrencySpec, string, string]> = [
      ['4500', EUR, 'en', '€45.00'], ['4500', EUR, 'de', '45,00 €'], ['4500', EUR, 'fr', '45,00 €'], ['4500', EUR, 'es', '45,00 €'],
      ['5', EUR, 'en', '€0.05'], ['5', EUR, 'de', '0,05 €'], ['5', USD, 'fr', '0,05 $US'], ['5', EUR, 'es', '0,05 €'],
      ['-5', EUR, 'en', '-€0.05'], ['-5', EUR, 'de', '-0,05 €'], ['-5', EUR, 'fr', '-0,05 €'], ['-5', EUR, 'es', '-0,05 €'],
      ['-250', USD, 'en', '-$2.50'], ['-250', EUR, 'de', '-2,50 €'], ['0', EUR, 'en', '€0.00'], ['0', JPY, 'en', '¥0'],
      ['12345678901234567890', USD, 'en', '$123,456,789,012,345,678.90'], ['12345678901234567890', EUR, 'de', '123.456.789.012.345.678,90 €'],
      ['12345678901234567890', EUR, 'fr', '123 456 789 012 345 678,90 €'], ['12345678901234567890', EUR, 'es', '123.456.789.012.345.678,90 €'],
      ['9007199254740993', EUR, 'en', '€90,071,992,547,409.93'], ['9007199254740993', JPY, 'en', '¥9,007,199,254,740,993'],
      ['4500', JPY, 'en', '¥4,500'], ['4500', KWD, 'en', 'KWD 4.500'], ['5', KWD, 'en', 'KWD 0.005'], ['5', KWD, 'de', '0,005 KWD'],
      ['100000000', BTC, 'en', '1.00000000 BTC'], ['100000000', BTC, 'de', '1,00000000 BTC'], ['5', BTC, 'en', '0.00000005 BTC'],
      ['5', ETH, 'en', '0.000000000000000005 ETH'], ['1000000000000000000', ETH, 'en', '1.000000000000000000 ETH'],
      ['1500000', USDC, 'en', '1.500000 USDC'], ['-5', USDC, 'de', '-0,000005 USDC'],
    ];
    for (const [amount, s, locale, expected] of goldens) expect(fmt(amount, s, locale), `${amount} ${s.code} ${locale}`).toBe(expected);
    // every fixture combination formats, 5 minor units of a 2-decimal currency shows 0.05 and -5 keeps the sign
    for (const l of LOCALES) for (const s of SPECS) for (const a of ['0', '5', '-5', '4500', '-250', '9007199254740993', '12345678901234567890']) expect(formatMoney(m(a, s), s, l).ok).toBe(true);
    for (const l of ['en', 'de', 'fr', 'es']) { expect(fmt('5', EUR, l)).toMatch(/0[.,]05/); expect(fmt('-5', EUR, l)).toMatch(/-.*0[.,]05|0[.,]05.*-/); }
  });
  it('display modes, trimZeros, parts and idempotence', () => {
    expect(fmt('4500', EUR, 'en', { display: 'code' })).toBe('EUR 45.00');
    expect(fmt('4500', EUR, 'en', { display: 'name' })).toBe('45.00 euros');
    expect(fmt('100', EUR, 'en', { display: 'name' })).toBe('1.00 euros');
    expect(fmt('100000000', BTC, 'en', { trimZeros: true })).toBe('1 BTC');
    expect(fmt('150000000', BTC, 'en', { trimZeros: true })).toBe('1.5 BTC');
    expect(fmt('4500', EUR, 'en', { trimZeros: true })).toBe('€45');
    const parts = formatMoneyParts(m('-123456', EUR), EUR, 'de');
    expect(parts.ok && parts.value.map(p => p.type)).toEqual(['sign', 'integer', 'group', 'integer', 'decimal', 'fraction', 'literal', 'currency']);
    expect(parts.ok && parts.value.find(p => p.type === 'fraction')?.value).toBe('56');
    expect(fmt('4500', EUR, 'xx_bad locale')).toBe('€45.00');
    expect(fmt('12345', USD, 'de')).toBe(fmt('12345', USD, 'de'));
  });
  it('TEST-PS-112-09.T03 amount 9007199254740993 formats exactly while a Number-based formatter differs', () => {
    const exact = fmt('9007199254740993', JPY, 'en');
    expect(exact).toBe('¥9,007,199,254,740,993');
    const naive = new Intl.NumberFormat('en', { style: 'currency', currency: 'JPY' }).format(Number('9007199254740993'));
    expect(naive).toBe('¥9,007,199,254,740,992');
    expect(norm(naive)).not.toBe(exact);
    const eur = fmt('9007199254740993', EUR, 'en');
    expect(eur).toBe('€90,071,992,547,409.93');
    expect(new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(Number('9007199254740993') / 100)).not.toBe(eur);
  });
});

describe('digit exactness (property)', () => {
  it('TEST-PS-112-09.T02 digits of formatToParts without group separators equal the input digits for 1..78 digit amounts, exponents 0..18, all locales and both engines', () => {
    const digitsOf = (parts: lib.MoneyPart[], type: 'integer' | 'fraction', locale: string) => {
      const map = new Map<string, string>();
      const nf = new Intl.NumberFormat(locale, { useGrouping: false });
      for (let d = 0; d < 10; d++) map.set(nf.format(d), String(d));
      return parts.filter(p => p.type === type).map(p => [...p.value].map(c => map.get(c) ?? c).join('')).join('');
    };
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 78 }), fc.bigInt({ min: 0n, max: 10n ** 78n - 1n }), fc.integer({ min: 0, max: 18 }), fc.constantFrom(...LOCALES), fc.boolean(), fc.constantFrom('decimal', 'bigint', 'auto') as fc.Arbitrary<'decimal' | 'bigint' | 'auto'>,
      (len, big, exponent, locale, negative, engine) => {
        const raw = (big % 10n ** BigInt(len)).toString();
        const digits = raw === '0' ? '0' : raw;
        const amount = negative && digits !== '0' ? `-${digits}` : digits;
        const s = spec('AAA', exponent, 'crypto');
        const r = formatMoneyParts(m(amount, { ...s, code: 'AAA' }), s, locale, { engine });
        if (!r.ok) return false;
        const padded = digits.padStart(exponent + 1, '0');
        const whole = padded.slice(0, padded.length - exponent), frac = padded.slice(padded.length - exponent);
        return digitsOf(r.value, 'integer', locale) === whole && digitsOf(r.value, 'fraction', locale) === frac;
      }), { numRuns: 1500 });
  });
  it('78-digit amounts format in every locale for ISO and crypto specs', () => {
    const max = '9'.repeat(78);
    for (const l of LOCALES) for (const s of [USD, JPY, KWD, ETH]) expect(formatMoney(m(max, s), s, l).ok).toBe(true);
    expect(fmt('9'.repeat(78), JPY, 'en').replace(/[^0-9]/g, '')).toBe('9'.repeat(78));
  });
});

describe('validation V01 to V06', () => {
  it('TEST-PS-112-09.T04 each rule V01 to V06 violated returns its documented code and no string', () => {
    const bad = (amount: string) => formatMoney({ amount, currency: 'EUR' }, EUR, 'en');
    for (const a of ['007', '1.5', '-0', '', '-', 'abc', ' 5', '9'.repeat(79), '-' + '9'.repeat(79), '１２']) { const r = bad(a); expect(code(r), a).toBe('I18N_MONEY_INVALID'); expect('value' in r).toBe(false); }
    expect(code(formatMoney({ amount: '5', currency: 'USD' }, EUR, 'en'))).toBe('I18N_MONEY_INVALID');
    expect(code(formatMoney({ amount: 5 as unknown as string, currency: 'EUR' }, EUR, 'en'))).toBe('I18N_MONEY_INVALID');
    for (const e of [-1, 19, 2.5, Number.NaN, undefined as unknown as number]) {
      const s = spec('EUR', e);
      expect(code(formatMoney(m('5', s), s, 'en')), String(e)).toBe('I18N_MONEY_EXPONENT_INVALID');
      expect(code(parseMoneyInput('5', s, 'en'))).toBe('I18N_MONEY_EXPONENT_INVALID');
      expect(code(formatApprox(m('5', s), s, { source: 'ECB', asOf: '2026-11-04T10:15:00Z' }, 'en', approx))).toBe('I18N_MONEY_EXPONENT_INVALID');
    }
    expect(code(parseMoneyInput('12,345', EUR, 'de'))).toBe('I18N_MONEY_PRECISION');
    expect(code(parseMoneyInput('1'.repeat(31), EUR, 'en'))).toBe('I18N_MONEY_TOO_LARGE');
    expect(code(parseMoneyInput('1000', EUR, 'en', { max: 99999n }))).toBe('I18N_MONEY_TOO_LARGE');
    const quote = (q: Parameters<typeof formatApprox>[2]) => formatApprox(m('4210', EUR), EUR, q, 'en', approx);
    for (const q of [{ source: 'x'.repeat(81), asOf: '2026-11-04T10:15:00Z' }, { source: 'ECB\nNews', asOf: '2026-11-04T10:15:00Z' }, { source: 'ECB' }, { source: 'ECB', asOf: 'yesterday' }, { source: 'ECB', asOf: '2026-11-04 10:15' }, { source: 'ECB', asOf: '2026-13-45T10:15:00Z' }, { source: 5 as unknown as string, asOf: '2026-11-04T10:15:00Z' }]) {
      const r = quote(q);
      expect(code(r), JSON.stringify(q)).toBe('I18N_QUOTE_LABEL_INVALID');
      expect('value' in r).toBe(false);
    }
    expect(code(formatApprox(m('4210', EUR), EUR, { source: 'ECB', asOf: '2026-11-04T10:15:00Z' }, 'en', { ...approx, timeZone: 'Not/AZone' }))).toBe('I18N_QUOTE_LABEL_INVALID');
    // V06: a successful approximate label always carries marker, code, source and time
    const okLabel = quote({ source: 'ECB', asOf: '2026-11-04T10:15:00Z' });
    expect(okLabel.ok && [okLabel.value.startsWith('≈'), okLabel.value.includes('EUR'), okLabel.value.includes('ECB'), okLabel.value.includes('10:15')]).toEqual([true, true, true, true]);
  });
});

const NOW = Date.parse('2026-11-04T12:00:00Z');
const enText = (k: string, p: Readonly<Record<string, string | number>>) => (enCatalog[k] as string).replace(/\{(\w+)\}/g, (_m, n: string) => String(p[n] ?? ''));
const approx: lib.ApproxOptions = { timeZone: 'UTC', now: NOW, translate: enText };

describe('engines and fallbacks', () => {
  it('TEST-PS-112-09.T05 with exact decimal-string support stubbed away the BigInt substitution path gives identical output on 20 samples including negatives with zero whole part', () => {
    const samples = ['0', '5', '-5', '-99', '4500', '-250', '9007199254740993', '-9007199254740993', '12345678901234567890', '-12345678901234567890', '1', '-1', '100', '-100', '999999', '-1000000', '123', '-7', '70000000000000000000000', '-70000000000000000000000000000000000000000000000000000000000000000000000000'];
    expect(samples).toHaveLength(20);
    const jobs = samples.flatMap(a => [[a, USD, 'en'], [a, EUR, 'de'], [a, JPY, 'fr'], [a, ETH, 'es'], [a, KWD, 'ar-XB']] as const);
    const expected = jobs.map(([a, s, l]) => fmt(a, s, l, { engine: 'decimal' }));
    const original = Intl.NumberFormat.prototype.formatToParts;
    vi.spyOn(Intl.NumberFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.NumberFormat) { return { locale: 'en', numberingSystem: 'latn' } as Intl.ResolvedNumberFormatOptions; });
    const decimalStringCalls = vi.fn();
    vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockImplementation(function (this: Intl.NumberFormat, v: unknown) {
      if (typeof v === 'string') { decimalStringCalls(); throw new Error('engine lacks decimal strings'); }
      return original.call(this, v as number);
    } as never);
    const got = jobs.map(([a, s, l]) => fmt(a, s, l));
    expect(decimalStringCalls).not.toHaveBeenCalled();
    expect(got).toEqual(expected);
    vi.restoreAllMocks();
    const self = runFormatSelfTest('en');
    expect(self).toEqual({ ok: true, checked: 20, mismatches: [] });
    expect(runFormatSelfTest('de').ok && runFormatSelfTest('ar-XB').ok).toBe(true);
  });
  it('TEST-PS-112-09.T06 BTC, ETH, USDC and an unknown code use decimal style plus the code, never throw and are never blank; RTL isolates', () => {
    const fallbacks: Array<{ currency: string; reason: string }> = [];
    expect(fmt('100000000', BTC, 'en')).toBe('1.00000000 BTC');
    expect(fmt('1000000000000000000', ETH, 'en')).toBe('1.000000000000000000 ETH');
    expect(fmt('2500000', USDC, 'de')).toBe('2,500000 USDC');
    // a 4-letter code declared as ISO would make Intl currency style throw a RangeError
    expect(() => new Intl.NumberFormat('en', { style: 'currency', currency: 'USDC' })).toThrow(RangeError);
    const bad = spec('USDC', 6, 'iso');
    const r = formatMoney(m('1500000', bad), bad, 'en', { onFallback: i => fallbacks.push(i) });
    expect(r.ok && norm(r.value)).toBe('1.500000 USDC');
    expect(fallbacks).toEqual([{ currency: 'USDC', reason: 'malformed-currency-code' }]);
    const weird = spec('Zq9', 2, 'custom');
    expect(fmt('5', weird, 'en')).toBe('0.05 Zq9');
    for (const l of LOCALES) for (const s of [BTC, ETH, USDC, bad, weird]) { const out = formatMoney(m('1', s), s, l); expect(out.ok && out.value.length).toBeGreaterThan(0); }
    const rtl = formatMoney(m('100000000', BTC), BTC, 'ar-XB');
    expect(rtl.ok && rtl.value.startsWith('⁨') && rtl.value.endsWith('BTC⁩')).toBe(true);
    const rtlIso = formatMoney(m('4500', EUR), EUR, 'ar-XB');
    expect(rtlIso.ok && rtlIso.value.startsWith('⁨') && rtlIso.value.endsWith('⁩')).toBe(true);
  });
  it('the formatter cache stays bounded and correct across more than 64 distinct keys', () => {
    for (let e = 0; e <= 18; e++) for (const l of LOCALES) { const s = spec('AAA', e, 'crypto'); expect(formatMoney(m('123456789', s), s, l).ok).toBe(true); }
    expect(fmt('4500', EUR, 'en')).toBe('€45.00');
  });
});

describe('formatApprox', () => {
  it('TEST-PS-112-09.T08 fresh quote, 25 h old quote, missing source and a source with bidi characters', async () => {
    const t = await translateFor('en');
    const opts = { timeZone: 'UTC', now: Date.parse('2026-11-04T12:00:00Z'), translate: t };
    const quote = { source: 'ECB', asOf: '2026-11-04T10:15:00Z' };
    const fresh = formatApprox(m('4210', EUR), EUR, quote, 'en', opts);
    expect(fresh.ok && fresh.value).toBe('≈ 42.10 EUR, quote from ECB at 10:15');
    const old = formatApprox(m('4210', EUR), EUR, quote, 'en', { ...opts, now: Date.parse('2026-11-05T11:15:01Z') });
    expect(old.ok && old.value).toBe('≈ 42.10 EUR, quote from ECB at 10:15 (old quote)');
    const edge = formatApprox(m('4210', EUR), EUR, quote, 'en', { ...opts, now: Date.parse('2026-11-05T10:15:00Z') });
    expect(edge.ok && edge.value).not.toContain('old quote');
    for (const q of [{ asOf: '2026-11-04T10:15:00Z' }, { source: '', asOf: '2026-11-04T10:15:00Z' }, { source: '  ' }]) {
      const missing = formatApprox(m('4210', EUR), EUR, q, 'en', opts);
      expect(missing.ok && missing.value).toBe('≈ 42.10 EUR, quote details unavailable');
    }
    const spoof = formatApprox(m('4210', EUR), EUR, { source: 'E‮evil‬CB', asOf: '2026-11-04T10:15:00Z' }, 'en', opts);
    expect(spoof.ok && spoof.value).toBe('≈ 42.10 EUR, quote from ⁨Eevil‬CB⁩ at 10:15'.replace('‬', ''));
    expect(spoof.ok && /[‪-‮]/.test(spoof.value)).toBe(false);
    const de = await translateFor('de');
    const german = formatApprox(m('4210', EUR), EUR, quote, 'de', { ...opts, translate: de });
    expect(german.ok && german.value).toBe('≈ 42,10 EUR, Kurs von ECB um 10:15');
    const berlin = formatApprox(m('4210', EUR), EUR, quote, 'en', { ...opts, timeZone: 'Asia/Kolkata', translate: t });
    expect(berlin.ok && berlin.value).toContain('at 15:45');
    const link = formatApprox(m('4210', EUR), EUR, { source: '<a href="x">ECB</a>', asOf: '2026-11-04T10:15:00Z' }, 'en', opts);
    expect(link.ok && link.value).toContain('<a href="x">ECB</a>');
  });
  it('an approximate label in an RTL locale isolates amount and source', async () => {
    const t = await translateFor('en');
    const r = formatApprox(m('4210', EUR), EUR, { source: 'ECB', asOf: '2026-11-04T10:15:00Z' }, 'ar-XB', { timeZone: 'UTC', now: NOW, translate: t });
    expect(r.ok && r.value).toContain('⁨ECB⁩');
    expect(r.ok && r.value).toContain('⁨');
  });
});

describe('parseMoneyInput', () => {
  it('TEST-PS-112-09.T09 12,50 (de), 12.50 (en), 12,345 (de), 1.234,50 (de), 12.5.0, 41 characters and 31 digits', () => {
    const run = (text: string, s: CurrencySpec, locale: string) => { const r = parseMoneyInput(text, s, locale); return r.ok ? r.value : r.error.code; };
    expect(run('12,50', EUR, 'de')).toBe('1250');
    expect(run('12.50', EUR, 'en')).toBe('1250');
    expect(run('12,345', EUR, 'de')).toBe('I18N_MONEY_PRECISION');
    expect(run('1.234,50', EUR, 'de')).toBe('123450');
    expect(run('12.5.0', EUR, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('1'.repeat(41), EUR, 'en')).toBe('I18N_MONEY_TOO_LARGE');
    expect(run('1'.repeat(31), EUR, 'en')).toBe('I18N_MONEY_TOO_LARGE');
    expect(run('1'.repeat(40), EUR, 'en')).toBe('I18N_MONEY_TOO_LARGE');
    expect(run('1'.repeat(28), EUR, 'en')).toBe('1'.repeat(28) + '00');
  });
  it('rejects ambiguous grouping, mixed separators, wrong characters and excess precision; accepts well-formed variants', () => {
    const run = (text: string, s: CurrencySpec, locale: string) => { const r = parseMoneyInput(text, s, locale); return r.ok ? r.value : r.error.code; };
    expect(run('12.345', EUR, 'de')).toBe('I18N_MONEY_PRECISION');
    expect(run('12.345', EUR, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('1,234.50', EUR, 'en')).toBe('123450');
    expect(run('1,234', EUR, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('1,234', JPY, 'en')).toBe('1234');
    expect(run('1.234,5', EUR, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('12,34,567.00', EUR, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('1 234,50', EUR, 'fr')).toBe('123450');
    expect(run('1 234,50', EUR, 'fr')).toBe('123450');
    expect(run('12.5', JPY, 'en')).toBe('I18N_MONEY_PRECISION');
    expect(run('12', JPY, 'en')).toBe('12');
    expect(run('0,005', KWD, 'de')).toBe('5');
    expect(run('1,0005', KWD, 'de')).toBe('I18N_MONEY_PRECISION');
    expect(run('12,5', EUR, 'de')).toBe('1250');
    expect(run(',5', EUR, 'de')).toBe('50');
    expect(run('007,10', EUR, 'de')).toBe('710');
    expect(run('-12,50', EUR, 'de')).toBe('-1250');
    expect(run('-0', EUR, 'en')).toBe('0');
    expect(run('', EUR, 'en')).toBe('I18N_MONEY_INVALID');
    expect(run('abc', EUR, 'en')).toBe('I18N_MONEY_INVALID');
    expect(run('12 EUR', EUR, 'en')).toBe('I18N_MONEY_INVALID');
    expect(run('12.', EUR, 'en')).toBe('1200');
    expect(run(7 as unknown as string, EUR, 'en')).toBe('I18N_MONEY_INVALID');
    expect(parseMoneyInput('100', EUR, 'en', { max: '10000' })).toEqual({ ok: true, value: '10000' });
    expect(code(parseMoneyInput('100.01', EUR, 'en', { max: '10000' }))).toBe('I18N_MONEY_TOO_LARGE');
    expect(run('0,00000000000000005', ETH, 'de')).toBe('50');
    // round trip: a formatted amount parses back to the same minor units
    for (const l of ['en', 'de', 'fr', 'es']) { const f = fmt('123456', spec('AAA', 2, 'crypto'), l).replace(' AAA', ''); expect(run(f, EUR, l), l).toBe('123456'); }
  });
  it('currencyName returns spoken-friendly, plural-aware names and the code for non-ISO assets', () => {
    expect(currencyName('EUR', 'en', 1)).toBe('euro');
    expect(currencyName('EUR', 'en', 2)).toBe('euros');
    expect(currencyName('EUR', 'de', 2)).toBe('Euro');
    expect(currencyName('BTC', 'en', 2)).toBe('BTC');
    expect(currencyName('usdc', 'en', 2)).toBe('usdc');
  });
});

describe('library contract', () => {
  it('TEST-PS-112-09.T07 exports are pure typed functions and error data; no commands, events, network or authorization calls', () => {
    const net = vi.fn(() => { throw new Error('io'); });
    vi.stubGlobal('fetch', net); vi.stubGlobal('XMLHttpRequest', net); vi.stubGlobal('WebSocket', net);
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    formatMoney(m('4500', EUR), EUR, 'en'); parseMoneyInput('1,5', EUR, 'en'); currencyName('EUR', 'en', 1);
    expect(net).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(Object.keys(lib).sort()).toEqual(['currencyErrors', 'currencyName', 'formatApprox', 'formatMoney', 'formatMoneyParts', 'parseMoneyInput', 'runFormatSelfTest']);
    for (const [name, v] of Object.entries(lib)) if (typeof v !== 'function') { expect(v, name).not.toHaveProperty('handler'); expect(v, name).not.toHaveProperty('capability'); }
    expect(Object.keys(lib.currencyErrors.codes).sort()).toEqual(['I18N_MONEY_EXPONENT_INVALID', 'I18N_MONEY_INVALID', 'I18N_MONEY_PRECISION', 'I18N_MONEY_TOO_LARGE', 'I18N_QUOTE_LABEL_INVALID']);
  });
  it('formatting leaves no amount in the fallback hook and never mutates its input', () => {
    const calls: unknown[] = [];
    const money = Object.freeze({ amount: '123456789', currency: 'USDC' });
    const s = Object.freeze(spec('USDC', 6, 'iso'));
    formatMoney(money, s, 'en', { onFallback: i => calls.push(i) });
    expect(JSON.stringify(calls)).not.toContain('123456789');
  });
  it('speed: warm formatMoney and parseMoneyInput average well under 0.05 ms over batches (not a spec claim)', () => {
    formatMoney(m('4500', EUR), EUR, 'en');
    const per: number[] = [];
    for (let b = 0; b < 50; b++) {
      const t0 = performance.now();
      for (let i = 0; i < 400; i++) { formatMoney(m('12345678901234567890', USD), USD, 'de'); parseMoneyInput('1.234,50', EUR, 'de'); }
      per.push((performance.now() - t0) / 800);
    }
    per.sort((a, b) => a - b);
    expect(per[47] as number).toBeLessThan(0.05);
  });
});
