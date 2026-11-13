import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lib from './index.ts';
import { checkLogicalCss, createI18n, dirOf, enCatalog, negotiateLocale, resolveLocaleSetting, shippedCatalogs, validateCatalog, validateCatalogSize, type Catalog, type Diagnostic } from './index.ts';

const SUPPORTED = ['en', 'de', 'fr', 'es', 'en-XA', 'ar-XB'];
function setup(over: Partial<Parameters<typeof createI18n>[0]> = {}) {
  const diagnostics: Diagnostic[] = [];
  const warns: unknown[] = [];
  const loads: string[] = [];
  const i18n = createI18n({
    en: enCatalog, supported: SUPPORTED, dev: true, warn: r => warns.push(r), diagnostics: d => diagnostics.push(d),
    loadCatalog: async locale => { loads.push(locale); return shippedCatalogs[locale]; }, ...over,
  });
  return { i18n, diagnostics, warns, loads };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('catalog validation (V01 to V04)', () => {
  it('TEST-PS-113-09.T01 shipped catalogs pass and each broken fixture fails with V01, V02, V03 or V04', () => {
    for (const [locale, cat] of Object.entries(shippedCatalogs)) expect(validateCatalog(locale, cat, enCatalog), locale).toEqual([]);
    const { 'listing.saved_local': _drop, ...missing } = shippedCatalogs['fr'] as Record<string, unknown>;
    expect(validateCatalog('fr', missing as Catalog, enCatalog).map(v => v.code)).toEqual(['I18N_CATALOG_KEY_MISSING']);
    const params = { ...shippedCatalogs['de'], 'language.changed': 'Sprache geändert auf {lang}' } as Catalog;
    expect(validateCatalog('de', params, enCatalog).map(v => v.code)).toEqual(['I18N_CATALOG_PARAM_MISMATCH']);
    const plural = { ...shippedCatalogs['fr'], 'offers.count': { one: '{count} offre', other: '{count} offres' } } as Catalog;
    const v3 = validateCatalog('fr', plural, enCatalog);
    expect(v3.map(v => v.code)).toEqual(['I18N_CATALOG_PLURAL_INCOMPLETE']);
    expect(v3[0]?.detail).toContain('many');
    const long = { ...shippedCatalogs['de'], 'listing.saved_local': 'x'.repeat(501) } as Catalog;
    expect(validateCatalog('de', long, enCatalog).map(v => v.code)).toEqual(['I18N_CATALOG_TOO_LARGE']);
  });
  it('uses English for invalid translated message shapes, blank forms or misplaced placeholders', async () => {
    const badEntries = {
      'money.approx': { other: '≈ {amount}', one: '{source} {time}' },
      'offers.count': { one: ' ', other: '{count} Angebote' },
      'language.automatic': '',
    };
    const translated = { ...shippedCatalogs['de'], ...badEntries };
    expect(validateCatalog('de', translated, enCatalog).map(v => v.key).sort()).toEqual(Object.keys(badEntries).sort());
    const { i18n, diagnostics } = setup({ loadCatalog: async () => translated });
    await i18n.setLocale('de');
    expect(i18n.t('money.approx', { amount: '42 EUR', source: 'ECB', time: '10:15' }))
      .toBe('≈ 42 EUR, quote from ECB at 10:15');
    expect(i18n.tp('offers.count', 1)).toBe('1 offer');
    expect(i18n.t('language.automatic')).toBe('Automatic');
    expect(diagnostics.filter(d => d.kind === 'invalid-entry').map(d => d.key).sort()).toEqual(Object.keys(badEntries).sort());
  });
  it('checks individual plural forms while allowing a locale-specific form to use the English other contract', async () => {
    const key = 'offers.count';
    const en = { [key]: { one: 'One {item}', other: '{count} {item}' } };
    const valid = { [key]: { one: 'Un {item}', many: '{count} {item}', other: '{count} {item}' } };
    expect(validateCatalog('fr', valid, en)).toEqual([]);
    for (const forms of [
      { one: 'Un {count}', many: '{count} {item}', other: '{count} {item}' },
      { one: 'Un {item}', many: '{count} {item}', other: '{count}' },
      { one: 'Un {item}', many: '{count} {item}', other: '{count} {item}', bogus: '{count} {item}' },
      '{count} {item}', null, 3,
    ]) {
      const malformed = { [key]: forms } as unknown as Catalog;
      expect(validateCatalog('fr', malformed, en)).not.toEqual([]);
      const i18n = createI18n({ en, supported: ['en', 'fr'], loadCatalog: async () => malformed });
      await i18n.setLocale('fr');
      expect(i18n.tp(key, 1, { item: 'apple' })).toBe('One apple');
      expect(i18n.tp(key, 2, { item: 'apples' })).toBe('2 apples');
    }
  });
  it('missing-allowed.json allowance counts only when it expires within 30 days and is not expired', () => {
    const now = Date.parse('2026-11-01T00:00:00Z');
    const { 'listing.saved_local': _d, ...rest } = shippedCatalogs['de'] as Record<string, unknown>;
    const run = (until: string) => validateCatalog('de', rest as Catalog, enCatalog, { now, allowMissing: { 'listing.saved_local': until } }).length;
    expect(run('2026-11-20')).toBe(0);
    expect(run('2026-10-31')).toBe(1);
    expect(run('2026-12-15')).toBe(1);
  });
  it('catalog gzip size check passes for shipped catalogs and fails above 30 KiB', async () => {
    expect(await validateCatalogSize('de', shippedCatalogs['de'] as Catalog)).toEqual([]);
    let seed = 7;
    const big: Record<string, string> = {};
    for (let i = 0; i < 4000; i++) { seed = (seed * 1103515245 + 12345) % 2147483648; big[`k.${i}`] = seed.toString(36) + (seed * 31).toString(36) + (seed * 17).toString(36); }
    expect((await validateCatalogSize('de', big))[0]?.code).toBe('I18N_CATALOG_TOO_LARGE');
  });
  it('generated pseudolocales are valid against en, keep parameters and expand text', () => {
    for (const l of ['en-XA', 'ar-XB']) expect(validateCatalog(l, shippedCatalogs[l] as Catalog, enCatalog)).toEqual([]);
    expect(shippedCatalogs['en-XA']?.['language.changed']).toContain('{language}');
    expect((shippedCatalogs['en-XA']?.['listing.saved_local'] as string).length).toBeGreaterThanOrEqual(Math.floor(21 * 1.4));
    expect(Object.keys(shippedCatalogs['ar-XB']?.['offers.count'] as object).sort()).toEqual(['few', 'many', 'one', 'other', 'two', 'zero']);
  });
});

describe('negotiation and direction', () => {
  it('TEST-PS-113-09.T02 negotiateLocale maps de-AT to de, pt-BR, xx-YY, malformed and empty to en without throwing', () => {
    const sup = ['en', 'de', 'fr', 'es'];
    expect(negotiateLocale(['de-AT', 'en-GB'], sup)).toBe('de');
    expect(negotiateLocale(['pt-BR'], sup)).toBe('en');
    expect(negotiateLocale(['xx-YY'], sup)).toBe('en');
    expect(negotiateLocale(['not a tag!!', '', 'de_DE'], sup)).toBe('en');
    expect(negotiateLocale([], sup)).toBe('en');
    expect(negotiateLocale([null, 42, {}] as unknown[], sup)).toBe('en');
    expect(negotiateLocale(['XX', 'FR-ca'], sup)).toBe('fr');
  });
  it('dirOf marks ar-XB and Arabic scripts rtl and never throws', () => {
    expect(dirOf('ar-XB')).toBe('rtl');
    expect(dirOf('he')).toBe('rtl');
    expect(dirOf('de')).toBe('ltr');
    expect(dirOf('%%%')).toBe('ltr');
  });
  it('resolveLocaleSetting keeps a valid unshipped tag, negotiates the effective locale and rejects malformed tags', () => {
    const r = resolveLocaleSetting('pt-BR', SUPPORTED);
    expect(r.ok && r.value).toEqual({ value: 'pt-BR', effective: 'en', shipped: false });
    const bad = resolveLocaleSetting('xx_YY', SUPPORTED);
    expect(!bad.ok && bad.error.code).toBe('I18N_LOCALE_UNSUPPORTED');
  });
});

describe('plural selection', () => {
  it('TEST-PS-113-09.T03 tp() uses the Intl.PluralRules category for counts 0..1000000 in every shipped locale', () => {
    return (async () => {
      const { i18n } = setup();
      for (const locale of SUPPORTED) {
        await i18n.setLocale(locale);
        expect(i18n.locale).toBe(locale);
        const rules = new Intl.PluralRules(locale);
        const entry = shippedCatalogs[locale]?.['offers.count'] as Record<string, string>;
        for (const c of rules.resolvedOptions().pluralCategories) expect(typeof entry[c], `${locale} ${c}`).toBe('string');
        fc.assert(fc.property(fc.oneof(fc.integer({ min: 0, max: 1_000_000 }), fc.constantFrom(0, 1, 2, 3, 5, 11, 21, 100, 1_000_000)), n => {
          const expected = (entry[rules.select(n)] ?? entry['other'] as string).replace('{count}', new Intl.NumberFormat(locale).format(n));
          const got = i18n.tp('offers.count', n);
          return locale === 'ar-XB' ? got.replace(/[⁨⁩]/g, '') === expected.replace(/[⁨⁩]/g, '') : got === expected;
        }), { numRuns: 300 });
      }
    })();
  });
  it('renders the same count used to select the plural when params also contain count', async () => {
    const { i18n } = setup();
    await i18n.setLocale('de');
    expect(i18n.tp('offers.count', 1, { count: 2 })).toBe('1 Angebot');
    expect(i18n.tp('offers.count', 2, { count: 1 })).toBe('2 Angebote');
  });
  it('the spec example renders German 1 Angebot and 3 Angebote', async () => {
    const { i18n } = setup();
    await i18n.setLocale('de');
    expect(i18n.tp('offers.count', 1)).toBe('1 Angebot');
    expect(i18n.tp('offers.count', 3)).toBe('3 Angebote');
  });
  it('a plural message lacking the needed category falls back to other at runtime', async () => {
    const { i18n } = setup({ loadCatalog: async () => ({ ...shippedCatalogs['fr'], 'offers.count': { one: '{count} offre', other: '{count} offres' } }) });
    await i18n.setLocale('fr');
    expect(i18n.tp('offers.count', 1_000_000)).toBe(`${new Intl.NumberFormat('fr').format(1_000_000)} offres`);
  });
});

describe('fallback, interpolation and diagnostics', () => {
  it('TEST-PS-113-09.T04 a key removed from fr falls back to en with a dev warning and a diagnostic, and a corrupt de catalog keeps the UI in en', async () => {
    const { 'listing.saved_local': _d, ...frMissing } = shippedCatalogs['fr'] as Record<string, unknown>;
    const a = setup({ loadCatalog: async () => frMissing });
    await a.i18n.setLocale('fr');
    expect(a.i18n.locale).toBe('fr');
    expect(a.i18n.t('listing.saved_local')).toBe('Saved on this device');
    expect(a.warns).toEqual([{ locale: 'fr', key: 'listing.saved_local' }]);
    expect(a.diagnostics).toContainEqual({ kind: 'missing-key', locale: 'fr', key: 'listing.saved_local' });
    expect(a.i18n.t('language.automatic')).toBe('Automatique');

    const b = setup({ loadCatalog: async () => 'this is { not json' });
    const res = await b.i18n.setLocale('de');
    expect(res).toMatchObject({ status: 'failed', locale: 'en', retry: true });
    expect(b.diagnostics).toContainEqual({ kind: 'corrupt-catalog', locale: 'de' });
    expect(b.i18n.t('language.automatic')).toBe('Automatic');
    for (const k of ['language.automatic', 'listing.saved_local', 'language.changed']) { const s = b.i18n.t(k, { language: 'x' }); expect(s).not.toBe(k); expect(s.length).toBeGreaterThan(0); }
    const arr = setup({ loadCatalog: async () => [1, 2] });
    expect((await arr.i18n.setLocale('de')).status).toBe('failed');
  });
  it('production mode (dev false) records diagnostics but never warns', async () => {
    const { 'listing.saved_local': _d, ...m } = shippedCatalogs['de'] as Record<string, unknown>;
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { i18n, diagnostics } = setup({ dev: false, loadCatalog: async () => m });
    await i18n.setLocale('de');
    i18n.t('listing.saved_local');
    expect(spy).not.toHaveBeenCalled();
    expect(diagnostics.some(d => d.kind === 'missing-key')).toBe(true);
  });
  it('a parameter mismatch against en or an over-long message is rejected per key and en is used', async () => {
    const { i18n, diagnostics } = setup({ loadCatalog: async () => ({ ...shippedCatalogs['de'], 'language.changed': 'Sprache {lang}', 'listing.saved_local': 'y'.repeat(501) }) });
    await i18n.setLocale('de');
    expect(i18n.t('language.changed', { language: 'Deutsch' })).toBe('Language changed to Deutsch');
    expect(i18n.t('listing.saved_local')).toBe('Saved on this device');
    expect(diagnostics.filter(d => d.kind === 'invalid-entry').map(d => d.key).sort()).toEqual(['language.changed', 'listing.saved_local']);
  });
  it('a missing parameter renders empty with a warning and does not throw; an unknown key never returns blank', () => {
    const { i18n, warns } = setup();
    expect(i18n.t('language.changed')).toBe('Language changed to ');
    expect(warns).toHaveLength(1);
    expect(i18n.t('no.such.key')).toBe('no.such.key');
    expect(i18n.t('constructor')).toBe('constructor');
  });
  it('TEST-PS-113-09.T07 params with script tags, parameter syntax and bidi overrides stay inert plain text and bidi is isolated', async () => {
    const { i18n } = setup();
    const hostile = '<script>alert(1)</script> {language} ‮evil‬';
    const out = i18n.t('language.changed', { language: hostile });
    expect(out).toBe('Language changed to ⁨<script>alert(1)</script> {language} evil⁩');
    expect(out).not.toMatch(/[‪-‮]/);
    expect(i18n.t('language.changed', { language: '{language}' })).toBe('Language changed to {language}');
    await i18n.setLocale('ar-XB');
    const rtl = i18n.tp('offers.count', 1234567);
    expect(rtl).toContain('⁨');
    expect(rtl).toContain('⁩');
  });
});

describe('locale switching', () => {
  it('switches through negotiate, load, lang and dir, announce; same locale is a no-op; lang/dir update for ar-XB', async () => {
    const applied: unknown[] = [];
    const said: string[] = [];
    const { i18n, loads } = setup({ applyDocument: (l, d) => applied.push([l, d]), announce: t => said.push(t) });
    expect(await i18n.setLocale(['de-AT'])).toEqual({ status: 'switched', locale: 'de', dir: 'ltr' });
    expect(said).toEqual(['Sprache geändert auf Deutsch']);
    expect((await i18n.setLocale('de')).status).toBe('unchanged');
    expect((await i18n.setLocale('ar-XB')).dir).toBe('rtl');
    expect(applied).toEqual([['de', 'ltr'], ['ar-XB', 'rtl']]);
    expect(loads).toEqual(['de', 'ar-XB']);
    expect((await i18n.setLocale('xx-YY')).status).toBe('switched');
    expect(i18n.locale).toBe('en');
  });
  it('catalog loads for the same locale share one in-flight promise and the last request wins', async () => {
    const releases: Record<string, () => void> = {};
    const loads: string[] = [];
    const { i18n } = setup({ loadCatalog: locale => { loads.push(locale); return new Promise(r => { releases[locale] = () => r(shippedCatalogs[locale]); }); } });
    const first = i18n.setLocale('de');
    const dup = i18n.loadCatalog('de');
    const second = i18n.setLocale('fr');
    await Promise.resolve();
    releases['fr']?.(); releases['de']?.();
    expect((await first).status).toBe('superseded');
    expect((await second).locale).toBe('fr');
    expect(await dup).toBe(true);
    expect(loads.filter(l => l === 'de')).toHaveLength(1);
    expect(i18n.locale).toBe('fr');
  });
  it('a failed load keeps the previous locale; load retries once after 1 s; a hung load times out after 5 s', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { i18n, diagnostics } = setup({ loadCatalog: async locale => { calls++; if (calls === 1) throw new Error('offline'); return shippedCatalogs[locale]; } });
    const p = i18n.setLocale('de');
    await vi.advanceTimersByTimeAsync(999);
    expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    expect((await p).status).toBe('switched');
    expect(calls).toBe(2);

    const hung = setup({ loadCatalog: () => new Promise(() => undefined) });
    const q = hung.i18n.setLocale('fr');
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await q).toMatchObject({ status: 'failed', locale: 'en', retry: true });
    expect(hung.diagnostics).toContainEqual({ kind: 'load-failed', locale: 'fr' });
    expect(diagnostics).toEqual([]);
  });
  it('Intl helpers format by active locale and never throw for bad input', async () => {
    const { i18n } = setup();
    await i18n.setLocale('de');
    expect(i18n.formatNumber(1234.5)).toBe('1.234,5');
    expect(i18n.formatList(['a', 'b', 'c'])).toBe('a, b und c');
    expect(i18n.formatDate(Date.UTC(2026, 10, 4), { timeZone: 'UTC', dateStyle: 'short' })).toBe('04.11.26');
    expect(lib.formatNumber('###', 5)).toBe('5');
    expect(lib.formatList('###', ['a', 'b'])).toBeTypeOf('string');
    expect(lib.formatDate('de', 0, { timeZone: 'Nope/Zone' })).toBeTypeOf('string');
  });
});

describe('library contract', () => {
  it('TEST-PS-113-09.T06 exports are pure functions, data or Result values; t() performs no network call and no vault or relay command is exposed', async () => {
    const net = vi.fn(() => { throw new Error('network call'); });
    vi.stubGlobal('fetch', net);
    vi.stubGlobal('XMLHttpRequest', net);
    vi.stubGlobal('WebSocket', net);
    const { i18n } = setup();
    i18n.t('language.automatic'); i18n.tp('offers.count', 2); negotiateLocale(['de'], SUPPORTED); dirOf('ar');
    expect(net).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    for (const [name, value] of Object.entries(lib)) {
      if (typeof value === 'function') continue;
      expect(JSON.parse(JSON.stringify(value)), name).toBeDefined();
      expect(value, name).not.toHaveProperty('capability');
      expect(value, name).not.toHaveProperty('handler');
    }
    expect(Object.keys(lib)).not.toContain('languageDefinitions');
    expect(resolveLocaleSetting('zz!', SUPPORTED).ok).toBe(false);
    expect(lib.languageErrors.has('I18N_CSS_PHYSICAL_PROPERTY')).toBe(true);
  });
  it('TEST-PS-113-09.T09 logical-CSS lint flags margin-left, padding-right and text-align right and accepts logical equivalents', () => {
    const bad = '.a { margin-left: 4px; }\n.b {\n  padding-right: 2px;\n  text-align: right;\n}\n/* left: 0 in a comment */\n.c { float: left; border-left-width: 1px; left: 0; }';
    const found = checkLogicalCss(bad, 'bad.css');
    expect(found.every(v => v.code === 'I18N_CSS_PHYSICAL_PROPERTY')).toBe(true);
    expect(found.map(v => v.line)).toEqual([1, 3, 4, 7]);
    const good = '.a { margin-inline-start: 4px; padding-inline-end: 2px; text-align: end; inset-inline-start: 0; border-inline-start-width: 1px; }';
    expect(checkLogicalCss(good)).toEqual([]);
  });
  it('TEST-PS-113-09.T10 locale switch and diagnostics use no network API; diagnostics reach only the injected local sink', async () => {
    const net = vi.fn(() => { throw new Error('network call'); });
    vi.stubGlobal('fetch', net);
    vi.stubGlobal('XMLHttpRequest', net);
    vi.stubGlobal('WebSocket', net);
    const beacon = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    const { 'listing.saved_local': _d, ...m } = shippedCatalogs['de'] as Record<string, unknown>;
    const sink: Diagnostic[] = [];
    const { i18n } = setup({ dev: false, diagnostics: d => sink.push(d), loadCatalog: async () => m });
    await i18n.setLocale('de');
    i18n.t('listing.saved_local');
    vi.unstubAllGlobals();
    expect(net).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(sink).toEqual([{ kind: 'missing-key', locale: 'de', key: 'listing.saved_local' }]);
  });
  it('TEST-PS-113-09.T14 new keys fall back to en until translated; i18n.locale import keeps unshipped values; rollback lands on a shipped locale', async () => {
    const newEn: Catalog = { ...enCatalog, 'feature.new': 'Brand new' };
    const { i18n } = setup({ en: newEn });
    await i18n.setLocale('de');
    expect(i18n.t('feature.new')).toBe('Brand new');
    expect(validateCatalog('de', shippedCatalogs['de'] as Catalog, newEn).map(v => v.key)).toEqual(['feature.new']);
    const imported = resolveLocaleSetting('fr-CA', ['en', 'de']);
    expect(imported.ok && imported.value).toEqual({ value: 'fr-CA', effective: 'en', shipped: false });
    const newer = resolveLocaleSetting('fr-CA', ['en', 'de', 'fr']);
    expect(newer.ok && newer.value.effective).toBe('fr');
    const rolledBack = createI18n({ en: enCatalog, supported: ['en', 'de'], loadCatalog: async l => shippedCatalogs[l] });
    expect((await rolledBack.setLocale(['fr'])).locale).toBe('en');
  });
});

describe('performance', () => {
  it('t() averages well under 0.05 ms per call over 100000 calls in batches', async () => {
    const { i18n } = setup({ dev: false });
    await i18n.setLocale('de');
    const per: number[] = [];
    for (let b = 0; b < 100; b++) {
      const t0 = performance.now();
      for (let i = 0; i < 1000; i++) i18n.t('language.changed', { language: 'Deutsch' });
      per.push((performance.now() - t0) / 1000);
    }
    per.sort((a, b) => a - b);
    expect(per[94] as number).toBeLessThanOrEqual(0.05);
  });
});
