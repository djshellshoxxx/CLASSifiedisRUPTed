// F06.S01.M03 Search filters (PS-044): pure, isomorphic filter value object, validator, canonical form and SQL compiler.
// No commands, queries, events or capabilities. Callers own authorization, rate limits and query execution.
import { appError, canonicalJson, defineErrors, err, ok, type AppError, type Result } from '@classrup/kernel';
import { cellsForRadius, discoveryGeoErrors, isCell, type Cell } from '../../geoprivacy/coarse/index.ts';

export const MODULE_ID = 'F06.S01.M03';
export const FILTER_SCHEMA = 'classrup.discovery.filter/v1';

export const LISTING_KINDS = ['sell', 'wanted', 'giveaway', 'service', 'rental', 'auction'] as const;
export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'for_parts'] as const;
export const DISTANCES_KM = [5, 10, 25, 50, 100] as const;
export const POSTED_WITHIN = ['24h', '7d', '30d'] as const;
export const MAX_CATEGORY_IDS = 10;
export const MAX_EXPANDED_CATEGORY_IDS = 200;
export const MAX_PRICE_MINOR = 1_000_000_000_000;
export const STALE_SNAPSHOT_MS = 30 * 86_400_000;
const POSTED_MS: Readonly<Record<(typeof POSTED_WITHIN)[number], number>> = { '24h': 86_400_000, '7d': 7 * 86_400_000, '30d': 30 * 86_400_000 };
const KEYS = ['barterAcceptable', 'categoryIds', 'centerCell', 'conditions', 'distanceKm', 'listingKinds', 'postedWithin', 'price'] as const;

export type ListingKind = (typeof LISTING_KINDS)[number];
export type Condition = (typeof CONDITIONS)[number];
export interface PriceFilter { readonly currency: string; readonly min?: number; readonly max?: number; }
/** The Filter value object (canonical shape). Amounts are integer minor units. */
export interface Filter {
  readonly barterAcceptable?: boolean;
  readonly categoryIds?: readonly string[];
  readonly centerCell?: Cell;
  readonly conditions?: readonly Condition[];
  readonly distanceKm?: (typeof DISTANCES_KM)[number];
  readonly listingKinds?: readonly ListingKind[];
  readonly postedWithin?: (typeof POSTED_WITHIN)[number];
  readonly price?: PriceFilter;
}

/** Module-specific error codes, defined once here (ERR-1). DISCOVERY_RADIUS_TOO_SMALL is owned by F06.S02.M01. */
export const discoveryFilterErrors = defineErrors({
  DISCOVERY_FILTER_INVALID: { status: 422, retryable: false },
  DISCOVERY_FILTER_CURRENCY_REQUIRED: { status: 422, retryable: false },
  DISCOVERY_FILTER_CENTER_REQUIRED: { status: 422, retryable: false },
});
type FilterCode = keyof typeof discoveryFilterErrors.codes;
const fail = (code: FilterCode, path: string): Result<never, AppError> => err(discoveryFilterErrors.make(code, { fields: [{ path, code }] }));
const tooSmall = (path: string): Result<never, AppError> => err(discoveryGeoErrors.make('DISCOVERY_RADIUS_TOO_SMALL', { fields: [{ path, code: 'DISCOVERY_RADIUS_TOO_SMALL' }] }));
const unavailable = (): Result<never, AppError> => err(appError('DEPENDENCY_UNAVAILABLE'));

/** Read ports supplied by the composition root (taxonomy: F18 governance catalog; currencies: F09.S03.M01). */
export interface FilterPorts {
  readonly categories: {
    /** The category id plus all descendants, or null when the id is unknown. */
    expand(categoryId: string): Result<readonly string[] | null, AppError>;
    /** Age of the taxonomy snapshot in ms; above 30 days a hint is raised, validation still proceeds. */
    snapshotAgeMs?(): number;
  };
  readonly currencies: { isRegistered(code: string): Result<boolean, AppError> };
  /** Stored home cell (exactly 5 characters), used when a distance filter carries no centerCell. */
  readonly homeCell?: () => string | undefined;
}

export interface ValidatedFilter {
  /** Canonical filter; centerCell is filled from the home cell when the input had none. */
  readonly filter: Filter;
  /** Sorted expanded category ids (empty when the filter has no categoryIds). */
  readonly categoryIds: readonly string[];
  /** Sorted cells covering distanceKm around the centre (empty without distanceKm). */
  readonly cells: readonly Cell[];
  readonly hints: { readonly categoriesMayBeOutOfDate: boolean };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
  && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const sortedUnique = <T extends string>(xs: readonly T[]): T[] => [...new Set(xs)].sort();

function amount(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= MAX_PRICE_MINOR) return v;
  if (typeof v === 'string' && /^(0|[1-9][0-9]{0,12})$/.test(v) && Number(v) <= MAX_PRICE_MINOR) return Number(v);
  return undefined;
}

function enumList<T extends string>(path: string, v: unknown, allowed: readonly T[], max: number): Result<T[], AppError> {
  if (!Array.isArray(v) || v.length < 1 || v.length > max) return fail('DISCOVERY_FILTER_INVALID', path);
  for (let i = 0; i < v.length; i++) if (typeof v[i] !== 'string' || !allowed.includes(v[i] as T)) return fail('DISCOVERY_FILTER_INVALID', `${path}[${i}]`);
  return ok(sortedUnique(v as T[]));
}

/** Pure structural validation (V01, V02, V04, V07 and shape of V03/V05); no ports are consulted. */
function structure(input: unknown): Result<Filter, AppError> {
  if (!isPlain(input)) return fail('DISCOVERY_FILTER_INVALID', '');
  for (const k of Object.keys(input)) if (!(KEYS as readonly string[]).includes(k)) return fail('DISCOVERY_FILTER_INVALID', k);
  const out: { -readonly [K in keyof Filter]: Filter[K] } = {};
  if (input.categoryIds !== undefined) {
    const v = input.categoryIds;
    if (!Array.isArray(v) || v.length < 1 || v.length > MAX_CATEGORY_IDS) return fail('DISCOVERY_FILTER_INVALID', 'categoryIds');
    for (let i = 0; i < v.length; i++) if (typeof v[i] !== 'string' || !UUID_RE.test(v[i])) return fail('DISCOVERY_FILTER_INVALID', `categoryIds[${i}]`);
    out.categoryIds = sortedUnique(v as string[]);
  }
  if (input.listingKinds !== undefined) { const r = enumList('listingKinds', input.listingKinds, LISTING_KINDS, 6); if (!r.ok) return r; out.listingKinds = r.value; }
  if (input.conditions !== undefined) { const r = enumList('conditions', input.conditions, CONDITIONS, 5); if (!r.ok) return r; out.conditions = r.value; }
  if (input.price !== undefined) {
    const p = input.price;
    if (!isPlain(p)) return fail('DISCOVERY_FILTER_INVALID', 'price');
    for (const k of Object.keys(p)) if (k !== 'currency' && k !== 'min' && k !== 'max') return fail('DISCOVERY_FILTER_INVALID', `price.${k}`);
    if (typeof p.currency !== 'string' || !CURRENCY_RE.test(p.currency)) return fail('DISCOVERY_FILTER_CURRENCY_REQUIRED', 'price.currency');
    const price: { currency: string; min?: number; max?: number } = { currency: p.currency };
    for (const k of ['min', 'max'] as const) {
      if (p[k] === undefined) continue;
      const n = amount(p[k]);
      if (n === undefined) return fail('DISCOVERY_FILTER_INVALID', `price.${k}`);
      price[k] = n;
    }
    if (price.min !== undefined && price.max !== undefined && price.min > price.max) return fail('DISCOVERY_FILTER_INVALID', 'price.min');
    out.price = price;
  }
  if (input.distanceKm !== undefined) {
    if (!(DISTANCES_KM as readonly unknown[]).includes(input.distanceKm)) return tooSmall('distanceKm');
    out.distanceKm = input.distanceKm as (typeof DISTANCES_KM)[number];
  }
  if (input.centerCell !== undefined) {
    if (input.distanceKm === undefined) return fail('DISCOVERY_FILTER_INVALID', 'centerCell');
    if (typeof input.centerCell !== 'string' || input.centerCell.length !== 5 || !isCell(input.centerCell)) return fail('DISCOVERY_FILTER_CENTER_REQUIRED', 'centerCell');
    out.centerCell = input.centerCell;
  }
  if (input.barterAcceptable !== undefined) {
    if (typeof input.barterAcceptable !== 'boolean') return fail('DISCOVERY_FILTER_INVALID', 'barterAcceptable');
    out.barterAcceptable = input.barterAcceptable;
  }
  if (input.postedWithin !== undefined) {
    if (!(POSTED_WITHIN as readonly unknown[]).includes(input.postedWithin)) return fail('DISCOVERY_FILTER_INVALID', 'postedWithin');
    out.postedWithin = input.postedWithin as (typeof POSTED_WITHIN)[number];
  }
  return ok(out);
}

/** Canonical form: sorted keys, sorted de-duplicated lists, integer amounts. Equal filters give equal bytes. */
export function canonicalize(filter: Filter): Filter {
  const r = structure(filter);
  if (!r.ok) throw new Error('canonicalize requires a structurally valid filter');
  const f = r.value;
  const out: { -readonly [K in keyof Filter]: Filter[K] } = {};
  for (const k of KEYS) {
    const v = f[k];
    if (v === undefined) continue;
    (out as Record<string, unknown>)[k] = k === 'price' ? { currency: (v as PriceFilter).currency, ...((v as PriceFilter).max !== undefined ? { max: (v as PriceFilter).max } : {}), ...((v as PriceFilter).min !== undefined ? { min: (v as PriceFilter).min } : {}) } : v;
  }
  return out;
}
/** Stable cache key and saved-search equality token of a filter. */
export function filterCacheKey(filter: Filter): string {
  return canonicalJson(canonicalize(filter));
}

/** Validates a filter completely (structure, combinations, ports). Returns the canonical filter with resolved expansion and cells. */
export function validateFilter(input: unknown, ports: FilterPorts): Result<ValidatedFilter, AppError> {
  const s = structure(input);
  if (!s.ok) return s;
  const f: { -readonly [K in keyof Filter]: Filter[K] } = { ...s.value };
  if (f.price) {
    let registered: Result<boolean, AppError>;
    try { registered = ports.currencies.isRegistered(f.price.currency); } catch { return unavailable(); }
    if (!registered.ok) return registered;
    if (!registered.value) return fail('DISCOVERY_FILTER_CURRENCY_REQUIRED', 'price.currency');
  }
  let center: string | undefined;
  if (f.distanceKm !== undefined) {
    center = f.centerCell;
    if (center === undefined) {
      try { center = ports.homeCell?.(); } catch { return unavailable(); }
    }
    if (typeof center !== 'string' || center.length !== 5 || !isCell(center)) return fail('DISCOVERY_FILTER_CENTER_REQUIRED', 'centerCell');
    f.centerCell = center;
  }
  let expanded: string[] = [];
  let stale = false;
  if (f.categoryIds) {
    const set = new Set<string>();
    for (let i = 0; i < f.categoryIds.length; i++) {
      const id = f.categoryIds[i] as string;
      let r: Result<readonly string[] | null, AppError>;
      try { r = ports.categories.expand(id); } catch { return unavailable(); }
      if (!r.ok) return r;
      if (r.value === null) return fail('DISCOVERY_FILTER_INVALID', `categoryIds[${i}]`);
      set.add(id);
      for (const d of r.value) {
        if (typeof d !== 'string' || !UUID_RE.test(d)) return unavailable();
        set.add(d);
        if (set.size > MAX_EXPANDED_CATEGORY_IDS) return fail('DISCOVERY_FILTER_INVALID', 'categoryIds');
      }
    }
    expanded = [...set].sort();
    try { stale = (ports.categories.snapshotAgeMs?.() ?? 0) > STALE_SNAPSHOT_MS; } catch { return unavailable(); }
  }
  let cells: Cell[] = [];
  if (f.distanceKm !== undefined && center !== undefined) {
    const c = cellsForRadius(center, f.distanceKm);
    if (!c.ok) return c;
    cells = c.value;
  }
  return ok({ filter: canonicalize(f), categoryIds: expanded, cells, hints: { categoriesMayBeOutOfDate: stale } });
}

export interface CompiledFilter { readonly sql: string; readonly params: readonly (string | number)[]; }
const marks = (n: number): string => Array.from({ length: n }, () => '?').join(',');

/**
 * Compiles a validated filter into a WHERE fragment over the SearchDocument alias d and its ordered bound parameters.
 * SQL text comes only from fixed fragments; values are never concatenated. `now` (epoch ms) is passed by the caller.
 */
export function compileFilter(validated: ValidatedFilter, now: number): Result<CompiledFilter, AppError> {
  if (typeof now !== 'number' || !Number.isFinite(now) || !Number.isFinite(new Date(now).getTime())) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'now', code: 'invalid' }] }));
  const f = validated.filter;
  const parts: string[] = []; const params: (string | number)[] = [];
  if (f.categoryIds) {
    if (validated.categoryIds.length === 0 || validated.categoryIds.length > 200) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'categoryIds', code: 'invalid' }] }));
    parts.push(`d.category_id IN (${marks(validated.categoryIds.length)})`); params.push(...validated.categoryIds);
  }
  if (f.listingKinds) { parts.push(`d.listing_kind IN (${marks(f.listingKinds.length)})`); params.push(...f.listingKinds); }
  if (f.price) {
    parts.push('d.currency = ?'); params.push(f.price.currency);
    if (f.price.min !== undefined) { parts.push('d.price_minor >= ?'); params.push(f.price.min); }
    if (f.price.max !== undefined) { parts.push('d.price_minor <= ?'); params.push(f.price.max); }
  }
  if (f.conditions) { parts.push(`d.condition IN (${marks(f.conditions.length)})`); params.push(...f.conditions); }
  if (f.distanceKm !== undefined) {
    const cells = validated.cells;
    if (cells.length === 0 || cells.length > 512) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'cells', code: 'invalid' }] }));
    if (cells[0]?.length === 5) { parts.push(`d.geo_cell5 IN (${marks(cells.length)})`); params.push(...cells); }
    else {
      // Coarser covering cells (precision 4) match every precision 5 child through a prefix range that keeps the cell index usable.
      parts.push(`(${cells.map(() => 'd.geo_cell5 BETWEEN ? AND ?').join(' OR ')})`);
      for (const c of cells) params.push(`${c}0`, `${c}z`);
    }
  }
  if (f.barterAcceptable !== undefined) { parts.push('d.barter = ?'); params.push(f.barterAcceptable ? 1 : 0); }
  if (f.postedWithin) { parts.push('d.first_seen_at >= ?'); params.push(new Date(now - POSTED_MS[f.postedWithin]).toISOString()); }
  return ok({ sql: parts.length === 0 ? '1 = 1' : parts.join(' AND '), params });
}
