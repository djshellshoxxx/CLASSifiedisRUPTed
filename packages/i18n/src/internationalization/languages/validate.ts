// F14.S02.M01 (PS-113): catalog types, CI validators (V01 to V04, V06), pseudolocale generation.
import { defineErrors } from '@classrup/kernel';

export const languageErrors = defineErrors({
  I18N_CATALOG_KEY_MISSING: { status: 400, retryable: false },
  I18N_CATALOG_PARAM_MISMATCH: { status: 400, retryable: false },
  I18N_CATALOG_PLURAL_INCOMPLETE: { status: 400, retryable: false },
  I18N_CATALOG_TOO_LARGE: { status: 400, retryable: false },
  I18N_LOCALE_UNSUPPORTED: { status: 400, retryable: false },
  I18N_CSS_PHYSICAL_PROPERTY: { status: 400, retryable: false },
});
export type LanguageErrorCode = keyof typeof languageErrors.codes;

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export const PLURAL_CATEGORIES: readonly PluralCategory[] = ['zero', 'one', 'two', 'few', 'many', 'other'];
export type PluralMessage = Partial<Record<PluralCategory, string>>;
export type CatalogEntry = string | PluralMessage;
export type Catalog = Readonly<Record<string, CatalogEntry>>;

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_CATALOG_GZIP_BYTES = 30 * 1024;
const PARAM_RE = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export interface Violation { readonly code: LanguageErrorCode; readonly locale: string; readonly key?: string; readonly detail: string; readonly line?: number }

export function isPluralMessage(e: unknown): e is PluralMessage {
  return typeof e === 'object' && e !== null && !Array.isArray(e);
}
export function formsOf(e: CatalogEntry): string[] {
  return typeof e === 'string' ? [e] : Object.values(e).filter((v): v is string => typeof v === 'string');
}
export function paramsOf(e: CatalogEntry): Set<string> {
  const out = new Set<string>();
  for (const f of formsOf(e)) for (const m of f.matchAll(PARAM_RE)) out.add(m[1] as string);
  return out;
}
export function requiredPluralCategories(locale: string): readonly PluralCategory[] {
  try { return new Intl.PluralRules(locale).resolvedOptions().pluralCategories as PluralCategory[]; } catch { return ['one', 'other']; }
}
const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(x => b.has(x));

type EntryIssue = Pick<Violation, 'code' | 'detail'>;

function checkForm(text: unknown, reference: string): EntryIssue | undefined {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { code: 'I18N_CATALOG_KEY_MISSING', detail: 'missing or empty message' };
  }
  if ([...text].length > MAX_MESSAGE_LENGTH) {
    return { code: 'I18N_CATALOG_TOO_LARGE', detail: `message longer than ${MAX_MESSAGE_LENGTH}` };
  }
  if (!sameSet(paramsOf(text), paramsOf(reference))) {
    return { code: 'I18N_CATALOG_PARAM_MISMATCH', detail: 'placeholders differ from the corresponding English message' };
  }
  return undefined;
}

/** Shared by the loader and CI. An absent locale-specific form may fall back to other at runtime. */
export function checkCatalogEntry(entry: unknown, reference: CatalogEntry): EntryIssue | undefined {
  if (typeof reference === 'string') return checkForm(entry, reference);
  if (!isPluralMessage(entry) || !Object.hasOwn(entry, 'other')) {
    return { code: 'I18N_CATALOG_PLURAL_INCOMPLETE', detail: 'expected plural forms including other' };
  }
  for (const [key, text] of Object.entries(entry)) {
    const category = key as PluralCategory;
    if (!PLURAL_CATEGORIES.includes(category)) {
      return { code: 'I18N_CATALOG_PLURAL_INCOMPLETE', detail: 'unknown plural category' };
    }
    const issue = checkForm(text, reference[category] ?? reference.other ?? '');
    if (issue) return issue;
  }
  return undefined;
}

export interface ValidateOptions {
  /** key -> ISO date (YYYY-MM-DD) until which a missing key is tolerated (missing-allowed.json). */
  readonly allowMissing?: Readonly<Record<string, string>>;
  /** Injected current time in epoch ms; defaults to 0 which makes every allowance expired. */
  readonly now?: number;
}
const DAY = 86_400_000;

/** V01, V02, V03 and V04 (message length) of one catalog against the en catalog. */
export function validateCatalog(locale: string, catalog: Catalog, en: Catalog, options: ValidateOptions = {}): Violation[] {
  const out: Violation[] = [];
  const required = requiredPluralCategories(locale);
  const now = options.now ?? 0;
  for (const [key, enEntry] of Object.entries(en)) {
    if (!Object.hasOwn(catalog, key)) {
      const until = options.allowMissing?.[key];
      const t = until === undefined ? Number.NaN : Date.parse(until);
      const allowed = Number.isFinite(t) && t >= now && t <= now + 30 * DAY;
      if (!allowed) out.push({ code: 'I18N_CATALOG_KEY_MISSING', locale, key, detail: until === undefined ? 'missing' : 'allowance expired or beyond 30 days' });
      continue;
    }
    const entry = catalog[key] as CatalogEntry;
    const issue = checkCatalogEntry(entry, enEntry);
    if (issue) {
      out.push({ locale, key, ...issue });
      continue;
    }
    if (isPluralMessage(enEntry) && isPluralMessage(entry)) {
      const missing = required.filter(category => !Object.hasOwn(entry, category));
      if (missing.length > 0) out.push({ code: 'I18N_CATALOG_PLURAL_INCOMPLETE', locale, key, detail: `missing ${missing.join(',')}` });
    }
  }
  return out;
}

/** Gzip size through the standard CompressionStream (isomorphic, no node: import). */
export async function catalogGzipBytes(catalog: Catalog): Promise<number> {
  const stream = new Blob([JSON.stringify(catalog)]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}
/** V04 catalog size. */
export async function validateCatalogSize(locale: string, catalog: Catalog): Promise<Violation[]> {
  const bytes = await catalogGzipBytes(catalog);
  return bytes > MAX_CATALOG_GZIP_BYTES ? [{ code: 'I18N_CATALOG_TOO_LARGE', locale, detail: `${bytes} gzip bytes` }] : [];
}

const PHYSICAL = /(^|[;{\s])(left|right|margin-left|margin-right|padding-left|padding-right|border-left(?:-[a-z-]+)?|border-right(?:-[a-z-]+)?)\s*:/;
const PHYSICAL_VALUE = /(^|[;{\s])(text-align|float|clear)\s*:\s*(left|right)\b/;
/** V06: physical direction properties in component styles. */
export function checkLogicalCss(css: string, file = 'inline'): Violation[] {
  const out: Violation[] = [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  stripped.split('\n').forEach((line, i) => {
    const m = PHYSICAL.exec(line) ?? PHYSICAL_VALUE.exec(line);
    if (m) out.push({ code: 'I18N_CSS_PHYSICAL_PROPERTY', locale: '-', detail: `${file}: ${(m[2] as string)}`, line: i + 1 });
  });
  return out;
}

const ACCENTS: Record<string, string> = { a: 'à', b: 'ƀ', c: 'ç', d: 'ď', e: 'é', f: 'ƒ', g: 'ğ', h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö', p: 'ƥ', q: 'ɋ', r: 'ŕ', s: 'š', t: 'ţ', u: 'ü', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž' };
const ARABIC = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
function mapText(text: string, f: (ch: string, i: number) => string): { text: string; visible: number } {
  let visible = 0, n = 0;
  const parts = text.split(/(\{[A-Za-z_][A-Za-z0-9_]*\})/);
  const mapped = parts.map((p, i) => {
    if (i % 2 === 1) return p;
    visible += p.length;
    return [...p].map(ch => f(ch, n++)).join('');
  });
  return { text: mapped.join(''), visible };
}
/** Pseudolocale generator (build step): en-XA accented and about 40 percent longer, ar-XB right to left. Parameters survive unchanged. */
export function generatePseudolocale(locale: 'en-XA' | 'ar-XB', en: Catalog): Catalog {
  const conv = (s: string): string => {
    if (locale === 'en-XA') {
      const m = mapText(s, ch => { const lower = ACCENTS[ch.toLowerCase()]; return lower === undefined ? ch : (ch === ch.toLowerCase() ? lower : lower.toUpperCase()); });
      return `[${m.text}${'·'.repeat(Math.ceil(m.visible * 0.4))}]`;
    }
    const m = mapText(s, (ch, i) => /[a-z]/i.test(ch) ? (ARABIC[(ch.toLowerCase().charCodeAt(0) - 97 + i) % ARABIC.length] as string) : ch);
    return `‏${m.text}`;
  };
  const required = requiredPluralCategories(locale);
  const out: Record<string, CatalogEntry> = {};
  for (const [key, entry] of Object.entries(en)) {
    if (typeof entry === 'string') { out[key] = conv(entry); continue; }
    const forms: PluralMessage = {};
    for (const c of required) forms[c] = conv(entry[c] ?? entry.other ?? '');
    out[key] = forms;
  }
  return out;
}
