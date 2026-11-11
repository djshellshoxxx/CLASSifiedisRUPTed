// F14.S02.M01 (PS-113) Languages: locale negotiation, catalogs, t()/tp(), direction, Intl helpers.
// Headless library: no commands, queries or events (ADR-0016: runs in the vault, no network, no telemetry).
import { err, ok, type Result } from '@classrup/kernel';
import { isPluralMessage, languageErrors, paramsOf, formsOf, requiredPluralCategories, MAX_MESSAGE_LENGTH, type Catalog, type CatalogEntry, type PluralMessage } from './validate.ts';

import { LANGUAGE_NAMES } from './catalogs.ts';
export * from './validate.ts';
export { en as enCatalog, de as deCatalog, fr as frCatalog, es as esCatalog, shippedCatalogs, SHIPPED_LOCALES, PSEUDO_LOCALES, LANGUAGE_NAMES } from './catalogs.ts';

export type Direction = 'ltr' | 'rtl';
const FSI = '⁨', PDI = '⁩';
const BIDI_CONTROLS = /[؜‎‏‪-‮⁦-⁩]/g;
const RTL_SCRIPTS = new Set(['Arab', 'Hebr', 'Thaa', 'Syrc', 'Nkoo', 'Adlm']);
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'dv', 'yi', 'ckb', 'sd', 'ug']);

function canonical(tag: unknown): string | undefined {
  if (typeof tag !== 'string' || tag.length === 0 || tag.length > 64) return undefined;
  try { return Intl.getCanonicalLocales(tag)[0]; } catch { return undefined; }
}
/** BCP 47 lookup (de-AT to de), then the fallback. Never throws; malformed or unsupported tags are skipped. */
export function negotiateLocale(requested: readonly unknown[] | string | undefined, supported: readonly string[], fallback = 'en'): string {
  const list = Array.isArray(requested) ? requested : typeof requested === 'string' ? [requested] : [];
  const sup = new Map<string, string>();
  for (const s of supported) sup.set(s.toLowerCase(), s);
  for (const r of list) {
    const c = canonical(r);
    if (c === undefined) continue;
    const parts = c.split('-');
    while (parts.length > 0) {
      const hit = sup.get(parts.join('-').toLowerCase());
      if (hit !== undefined) return hit;
      parts.pop();
    }
  }
  return fallback;
}
/** V05 for a stored setting such as i18n.locale: a valid BCP 47 tag is kept even when not shipped; the effective locale is negotiated. */
export function resolveLocaleSetting(value: unknown, supported: readonly string[]): Result<{ readonly value: string; readonly effective: string; readonly shipped: boolean }> {
  const c = canonical(value);
  if (c === undefined) return err(languageErrors.make('I18N_LOCALE_UNSUPPORTED', { params: { reason: 'malformed' } }));
  const effective = negotiateLocale([c], supported);
  return ok({ value: c, effective, shipped: supported.some(s => s.toLowerCase() === c.toLowerCase()) });
}
export function dirOf(locale: string): Direction {
  const c = canonical(locale);
  if (c === undefined) return 'ltr';
  try {
    const l = new Intl.Locale(c);
    const script = l.script ?? l.maximize().script;
    if (script !== undefined) return RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr';
    return RTL_LANGS.has(l.language) ? 'rtl' : 'ltr';
  } catch { return 'ltr'; }
}
const safeLocale = (locale: string): string => canonical(locale) ?? 'en';

export function formatNumber(locale: string, value: number | bigint, options?: Intl.NumberFormatOptions): string {
  try { return new Intl.NumberFormat(safeLocale(locale), options).format(value); } catch { return new Intl.NumberFormat('en').format(value); }
}
export function formatDate(locale: string, value: Date | number, options?: Intl.DateTimeFormatOptions): string {
  try { return new Intl.DateTimeFormat(safeLocale(locale), options).format(value); } catch { return new Intl.DateTimeFormat('en', { timeZone: 'UTC' }).format(value); }
}
export function formatList(locale: string, items: readonly string[], options?: Intl.ListFormatOptions): string {
  try { return new Intl.ListFormat(safeLocale(locale), options).format(items); } catch { return items.join(', '); }
}

export type Params = Readonly<Record<string, string | number | bigint>>;
export interface MissingReport { readonly locale: string; readonly key: string }
export interface Diagnostic { readonly kind: 'missing-key' | 'missing-param' | 'corrupt-catalog' | 'invalid-entry' | 'load-failed'; readonly locale: string; readonly key?: string }
export type SetLocaleResult =
  | { readonly status: 'switched' | 'unchanged'; readonly locale: string; readonly dir: Direction }
  | { readonly status: 'superseded'; readonly locale: string; readonly dir: Direction }
  | { readonly status: 'failed'; readonly locale: string; readonly dir: Direction; readonly retry: true };

export interface I18nOptions {
  /** The en catalog, always available (shipped in the main bundle). */
  readonly en: Catalog;
  readonly supported: readonly string[];
  /** Fetches one catalog (parsed JSON, untrusted). Provided by the PWA; precached by the service worker. */
  readonly loadCatalog: (locale: string) => Promise<unknown>;
  /** Development builds only: warn on missing keys and params. Production writes diagnostics only. */
  readonly dev?: boolean;
  readonly warn?: (report: MissingReport) => void;
  /** Local diagnostics sink (P3, never transmitted). */
  readonly diagnostics?: (entry: Diagnostic) => void;
  /** Sets document lang and dir. */
  readonly applyDocument?: (lang: string, dir: Direction) => void;
  /** Polite live region announcement, already in the new language. */
  readonly announce?: (text: string, locale: string) => void;
  readonly languageName?: (locale: string) => string;
  readonly loadTimeoutMs?: number;
  readonly retryDelayMs?: number;
}

function sanitizeCatalog(raw: unknown, locale: string, en: Catalog, report: (d: Diagnostic) => void): Catalog | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) { report({ kind: 'corrupt-catalog', locale }); return undefined; }
  const out: Record<string, CatalogEntry> = {};
  for (const [key, entry] of Object.entries(raw)) {
    const enEntry = Object.hasOwn(en, key) ? en[key] : undefined;
    const shape = typeof entry === 'string' || (isPluralMessage(entry) && Object.values(entry).every(v => typeof v === 'string'));
    const e = entry as CatalogEntry;
    const bad = !shape || enEntry === undefined
      || (typeof e !== 'string' && typeof e.other !== 'string')
      || formsOf(e).some(f => f.length > MAX_MESSAGE_LENGTH)
      || ![...paramsOf(enEntry)].every(p => paramsOf(e).has(p)) || paramsOf(e).size !== paramsOf(enEntry).size;
    if (bad) { report({ kind: 'invalid-entry', locale, key }); continue; }
    out[key] = e;
  }
  return out;
}

export function createI18n(options: I18nOptions) {
  const catalogs = new Map<string, Catalog>([['en', options.en]]);
  const inflight = new Map<string, Promise<boolean>>();
  const rules = new Map<string, Intl.PluralRules>();
  let active = 'en';
  let seq = 0;
  const report = (d: Diagnostic) => {
    options.diagnostics?.(d);
    if (options.dev && d.key !== undefined && (d.kind === 'missing-key' || d.kind === 'missing-param')) (options.warn ?? ((r: MissingReport) => console.warn('i18n.missing', r)))({ locale: d.locale, key: d.key });
  };
  const pluralRules = (locale: string) => {
    let r = rules.get(locale);
    if (!r) { try { r = new Intl.PluralRules(locale); } catch { r = new Intl.PluralRules('en'); } rules.set(locale, r); }
    return r;
  };
  function lookup(key: string): { entry: CatalogEntry | undefined; locale: string } {
    const cat = catalogs.get(active) ?? options.en;
    if (Object.hasOwn(cat, key)) return { entry: cat[key], locale: active };
    report({ kind: 'missing-key', locale: active, key });
    if (active !== 'en' && Object.hasOwn(options.en, key)) return { entry: options.en[key], locale: 'en' };
    return { entry: undefined, locale: 'en' };
  }
  function render(template: string, params: Params | undefined, locale: string, key: string): string {
    const rtl = dirOf(locale) === 'rtl';
    // Single pass: inserted values are never re-scanned, so user text cannot inject parameters.
    return template.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, name: string) => {
      const v = params !== undefined && Object.hasOwn(params, name) ? params[name] : undefined;
      if (v === undefined) { report({ kind: 'missing-param', locale, key }); return ''; }
      if (typeof v === 'string') {
        const clean = v.replace(BIDI_CONTROLS, '');
        return rtl || clean !== v ? `${FSI}${clean}${PDI}` : clean;
      }
      const n = formatNumber(locale, v);
      return rtl ? `${FSI}${n}${PDI}` : n;
    });
  }
  function t(key: string, params?: Params): string {
    const { entry, locale } = lookup(key);
    if (entry === undefined) return key; // key absent from en too: a catalog bug caught by CI; never blank
    const template = typeof entry === 'string' ? entry : (entry.other ?? '');
    return render(template, params, locale, key);
  }
  function tp(key: string, count: number, params?: Params): string {
    const { entry, locale } = lookup(key);
    if (entry === undefined) return key;
    const n = Number.isFinite(count) ? count : 0;
    let template: string;
    if (typeof entry === 'string') template = entry;
    else { const forms: PluralMessage = entry; template = forms[pluralRules(locale).select(n) as keyof PluralMessage] ?? forms.other ?? ''; }
    return render(template, { count: n, ...params }, locale, key);
  }

  const timed = <T>(p: Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('catalog load timeout')), options.loadTimeoutMs ?? 5000);
    p.then(v => { clearTimeout(timer); resolve(v); }, (e: unknown) => { clearTimeout(timer); reject(e); });
  });
  const attempt = (locale: string) => timed(Promise.resolve().then(() => options.loadCatalog(locale)));
  async function fetchCatalog(locale: string): Promise<boolean> {
    let raw: unknown;
    try { raw = await attempt(locale); } catch {
      await new Promise<void>(r => setTimeout(r, options.retryDelayMs ?? 1000));
      try { raw = await attempt(locale); } catch { report({ kind: 'load-failed', locale }); return false; }
    }
    const clean = sanitizeCatalog(raw, locale, options.en, report);
    if (clean === undefined) return false;
    catalogs.set(locale, clean);
    return true;
  }
  /** Catalog loads for the same locale share one in-flight promise. Resolves true when the catalog is installed. */
  function loadCatalog(locale: string): Promise<boolean> {
    if (catalogs.has(locale)) return Promise.resolve(true);
    let p = inflight.get(locale);
    if (!p) { p = fetchCatalog(locale).finally(() => inflight.delete(locale)); inflight.set(locale, p); }
    return p;
  }
  async function setLocale(requested: readonly unknown[] | string): Promise<SetLocaleResult> {
    const target = negotiateLocale(requested, options.supported);
    const mine = ++seq;
    if (target === active) return { status: 'unchanged', locale: active, dir: dirOf(active) };
    const loaded = await loadCatalog(target);
    if (mine !== seq) return { status: 'superseded', locale: active, dir: dirOf(active) };
    if (!loaded) return { status: 'failed', locale: active, dir: dirOf(active), retry: true };
    active = target;
    const dir = dirOf(active);
    options.applyDocument?.(active, dir);
    const name = options.languageName?.(active) ?? languageNameIn(active);
    options.announce?.(t('language.changed', { language: name }), active);
    return { status: 'switched', locale: active, dir };
  }
  return {
    get locale() { return active; },
    get dir(): Direction { return dirOf(active); },
    t, tp, loadCatalog, setLocale,
    negotiate: (requested: readonly unknown[] | string) => negotiateLocale(requested, options.supported),
    formatDate: (value: Date | number, o?: Intl.DateTimeFormatOptions) => formatDate(active, value, o),
    formatList: (items: readonly string[], o?: Intl.ListFormatOptions) => formatList(active, items, o),
    formatNumber: (value: number | bigint, o?: Intl.NumberFormatOptions) => formatNumber(active, value, o),
  };
}
export type I18n = ReturnType<typeof createI18n>;

function languageNameIn(locale: string): string {
  const own = Object.hasOwn(LANGUAGE_NAMES, locale) ? LANGUAGE_NAMES[locale] : undefined;
  if (own !== undefined) return own;
  try { return new Intl.DisplayNames(locale, { type: 'language' }).of(locale) ?? locale; } catch { return locale; }
}
export { requiredPluralCategories };
