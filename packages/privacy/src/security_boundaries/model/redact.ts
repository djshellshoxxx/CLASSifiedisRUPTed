// Sink-aware redaction: per-path classification, fail-closed defaults, location snapping, bounded traversal.
import { appError, isIP, truncateIp, type AppError } from '@classrup/kernel';
import { canFlowTo, capLocation, classRank, levelRank, maxClass, SINKS, type FlowContext, type LocationLevel, type PrivacyClass, type Sink } from './classes.ts';
import { defaultClassificationRegistry, lookup, type ClassificationMap, type ClassificationRegistry } from './classification.ts';
import { modelErrors } from './errors.ts';
import { geohashEncode, GEOHASH_RE } from './geohash.ts';

export const MAX_DEPTH = 32;
export const MAX_RECORD_BYTES = 1024 * 1024;
export const MAX_NODES = 50_000;

export interface RedactionContext extends FlowContext {
  /** Refuse instead of returning a reduced copy when anything had to be removed or snapped. */
  readonly strict?: boolean;
  /** Keyed or plain digest supplied by the caller for the `hash` strategy; without it hash fields are dropped. */
  readonly hash?: (value: string) => string;
  readonly registry?: ClassificationRegistry;
}

export interface RedactionResult {
  /** Safe copy, or null when refused. */
  readonly value: unknown;
  /** Normalized paths removed, replaced or snapped; never values. */
  readonly dropped: readonly string[];
  readonly refused?: boolean;
  readonly error?: AppError;
  /** Highest class among the input's fields, including removed ones. */
  readonly class: PrivacyClass;
}

type Cause = 'missing' | 'class' | 'location';
interface State {
  readonly map: ClassificationMap;
  readonly sink: Sink;
  readonly ctx: RedactionContext;
  readonly prefixes: ReadonlySet<string>;
  dropped: string[];
  altered: string[];
  cls: PrivacyClass;
  firstCause: Cause | undefined;
  nodes: number;
  fatal: AppError | undefined;
}

const KEY_RE = /^[A-Za-z0-9_$-]+$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const IPV4_ONLY_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b(?!\/)/g;
const HOUR_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/;
const TS_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}):\d{2}:\d{2}(?:\.\d+)?Z$/;
const prefixCache = new WeakMap<ClassificationMap, ReadonlySet<string>>();

function prefixesOf(map: ClassificationMap): ReadonlySet<string> {
  const cached = prefixCache.get(map);
  if (cached) return cached;
  // Container paths: every proper ancestor of a classified path, including array levels above the final element.
  const set = new Set<string>(['']);
  for (const path of Object.keys(map.fields)) {
    const parts = path.split('.');
    let cur = '';
    parts.forEach((part, idx) => {
      const base = part.replace(/(\[\])+$/, '');
      const arrays = (part.length - base.length) / 2;
      const last = idx === parts.length - 1;
      cur = cur ? `${cur}.${base}` : base;
      if (!last || arrays > 0) set.add(cur);
      for (let i = 1; i <= arrays; i++) {
        cur += '[]';
        if (!last || i < arrays) set.add(cur);
      }
    });
  }
  prefixCache.set(map, set);
  return set;
}

function isPlain(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const p = Object.getPrototypeOf(v) as unknown;
  return p === Object.prototype || p === null;
}

/** Bounded pre-pass: depth, node count and byte estimate are checked before the real traversal. */
function withinBounds(root: unknown): boolean {
  let nodes = 0;
  let bytes = 0;
  const visit = (v: unknown, depth: number): boolean => {
    if (depth > MAX_DEPTH || ++nodes > MAX_NODES) return false;
    if (typeof v === 'string') return (bytes += v.length) <= MAX_RECORD_BYTES;
    if (Array.isArray(v)) {
      bytes += 2;
      for (const x of v) if (!visit(x, depth + 1)) return false;
      return bytes <= MAX_RECORD_BYTES;
    }
    if (typeof v === 'object' && v !== null) {
      for (const k of Object.keys(v)) {
        bytes += k.length;
        if (bytes > MAX_RECORD_BYTES || !visit((v as Record<string, unknown>)[k], depth + 1)) return false;
      }
      return true;
    }
    bytes += 8;
    return bytes <= MAX_RECORD_BYTES;
  };
  return visit(root, 0);
}

// Free-text scrubbing is hand-written and linear: regexes with unbounded runs backtrack quadratically on hostile input.
const isDigit = (c: number): boolean => c >= 48 && c <= 57;
const isLetter = (c: number): boolean => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isLocalCh = (c: number): boolean => isDigit(c) || isLetter(c) || c === 46 || c === 95 || c === 37 || c === 43 || c === 45;
const isDomainCh = (c: number): boolean => isDigit(c) || isLetter(c) || c === 46 || c === 45;
const isPhoneCh = (c: number): boolean => isDigit(c) || c === 32 || (c >= 9 && c <= 13) || c === 40 || c === 41 || c === 46 || c === 45 || c === 43;

function scrubEmails(s: string): string {
  if (!s.includes('@')) return s;
  let out = '';
  let last = 0;
  let from = 0;
  for (;;) {
    const at = s.indexOf('@', from);
    if (at < 0) break;
    from = at + 1;
    let l = at;
    while (l > last && isLocalCh(s.charCodeAt(l - 1))) l--;
    let r = at + 1;
    while (r < s.length && isDomainCh(s.charCodeAt(r))) r++;
    if (l === at) continue;
    let end = -1;
    for (let k = r - 1; k > at + 1; k--) {
      if (s.charCodeAt(k) !== 46) continue;
      let e = k + 1;
      while (e < r && isLetter(s.charCodeAt(e))) e++;
      if (e - k - 1 >= 2) {
        end = e;
        break;
      }
    }
    if (end < 0) continue;
    out += `${s.slice(last, l)}[email]`;
    last = end;
    from = Math.max(from, end);
  }
  return out + s.slice(last);
}

function scrubPhones(s: string): string {
  let out = '';
  let last = 0;
  let i = 0;
  while (i < s.length) {
    if (!isPhoneCh(s.charCodeAt(i))) {
      i++;
      continue;
    }
    let j = i;
    while (j < s.length && isPhoneCh(s.charCodeAt(j))) j++;
    let a = i;
    while (a < j && !isDigit(s.charCodeAt(a))) a++;
    let b = j;
    while (b > a && !isDigit(s.charCodeAt(b - 1))) b--;
    if (b - a >= 9) {
      let digits = 0;
      for (let k = a; k < b; k++) if (isDigit(s.charCodeAt(k))) digits++;
      const span = b - a <= 20 ? s.slice(a, b) : '';
      if (digits >= 7 && !DATE_ONLY_RE.test(span) && !IPV4_ONLY_RE.test(span)) {
        const start = a > i && s.charCodeAt(a - 1) === 43 ? a - 1 : a;
        out += `${s.slice(last, start)}[phone]`;
        last = b;
      }
    }
    i = j;
  }
  return out + s.slice(last);
}

function scrub(s: string): string {
  return scrubPhones(scrubEmails(s.replace(IPV4_RE, (m) => truncateIp(m) ?? m)));
}

function cloneJson(v: unknown, sink: Sink): unknown {
  if (typeof v === 'string') return sink === 'log' ? scrub(v) : v;
  if (Array.isArray(v)) return v.map((x) => cloneJson(x, sink));
  if (isPlain(v)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v)) if (KEY_RE.test(k) && k !== '__proto__') out[k] = cloneJson(v[k], sink);
    return out;
  }
  return v;
}

function jsonSafe(v: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every((x) => jsonSafe(x, depth + 1));
  if (isPlain(v)) return Object.keys(v).every((k) => KEY_RE.test(k) && k !== '__proto__' && jsonSafe(v[k], depth + 1));
  return false;
}

const LEVEL_CELL_LENGTH = [0, 4, 5, 6] as const;

function locationLevelOf(v: unknown): { level: number; lat?: number; lon?: number; cell?: string } | undefined {
  if (typeof v === 'string' && GEOHASH_RE.test(v)) return { level: v.length <= 4 ? 1 : v.length === 5 ? 2 : v.length === 6 ? 3 : 4, cell: v };
  if (isPlain(v)) {
    const lat = v['lat'] ?? v['latitude'];
    const lon = v['lon'] ?? v['lng'] ?? v['longitude'];
    if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { level: 4, lat, lon };
  }
  return undefined;
}

function note(st: State, path: string, cause: Cause): void {
  if (!st.dropped.includes(path)) st.dropped.push(path);
  st.firstCause ??= cause;
}

function placeholder(st: State, cls: PrivacyClass): unknown {
  return st.sink === 'log' ? `[redacted:${cls}]` : undefined;
}

const DROP = Symbol('drop');

function leaf(v: unknown, path: string, st: State): unknown {
  const entry = lookup(st.map, path);
  const cls = entry?.class ?? 'P3';
  st.cls = maxClass(st.cls, cls);
  if (!entry) return blocked(v, path, st, cls, 'missing', undefined);
  if (!canFlowTo(cls, st.sink, st.ctx)) return blocked(v, path, st, cls, 'class', entry.redact);
  if (entry.level !== undefined) return location(v, path, st, entry.level);
  if (!jsonSafe(v)) return blocked(v, path, st, cls, 'class', undefined);
  return cloneJson(v, st.sink);
}

function alreadyTruncated(v: string): boolean {
  if (HOUR_RE.test(v)) return true;
  const m = /^(.+)\/(24|48)$/.exec(v);
  return m !== null && isIP(m[1] as string) && truncateIp(m[1] as string) === v;
}

function blocked(v: unknown, path: string, st: State, cls: PrivacyClass, cause: Cause, strategy: string | undefined): unknown {
  if (cause === 'class' && classRank(cls) < 4 && typeof v === 'string') {
    if (strategy === 'truncate') {
      const t = TS_RE.exec(v);
      const ip = isIP(v) ? truncateIp(v) : undefined;
      const out = ip ?? (t ? `${t[1]}:00:00.000Z` : alreadyTruncated(v) ? v : undefined);
      if (out !== undefined) {
        if (!st.altered.includes(path)) st.altered.push(path);
        st.firstCause ??= 'class';
        return out;
      }
    } else if (strategy === 'hash' && st.ctx.hash && (st.sink === 'log' || st.sink === 'event') && classRank(cls) >= 1) {
      if (!st.altered.includes(path)) st.altered.push(path);
      st.firstCause ??= 'class';
      return st.ctx.hash(v);
    }
  }
  note(st, path, cause);
  const ph = placeholder(st, cls);
  return ph === undefined ? DROP : ph;
}

function location(v: unknown, path: string, st: State, declared: LocationLevel): unknown {
  const cap = levelRank(capLocation(declared, st.sink));
  if (v === null) return null; // L0: no location
  const loc = locationLevelOf(v);
  if (!loc) {
    // Unparseable location: cannot prove it is coarse, so public sinks refuse and owner sinks drop it.
    note(st, path, 'location');
    if (cap < 4 && st.sink !== 'log') st.fatal ??= modelErrors.make('PRIVACY_LOCATION_TOO_PRECISE', { fields: [{ path, code: 'NO_CELL' }] });
    return st.sink === 'log' ? '[redacted:location]' : DROP;
  }
  if (loc.level <= cap) return loc.cell !== undefined ? loc.cell : { ...(v as Record<string, unknown>) };
  if (cap === 0) {
    note(st, path, 'location');
    return DROP;
  }
  const len = LEVEL_CELL_LENGTH[cap] as number;
  if (!st.altered.includes(path)) st.altered.push(path);
  st.firstCause ??= 'location';
  return loc.cell !== undefined ? loc.cell.slice(0, len) : geohashEncode(loc.lat as number, loc.lon as number, len);
}

function walk(v: unknown, path: string, st: State): unknown {
  if (v === undefined) return DROP;
  if (++st.nodes > MAX_NODES) throw new RangeError('node budget');
  const container = Array.isArray(v) || isPlain(v);
  if (container && st.prefixes.has(path)) {
    if (Array.isArray(v)) {
      const out: unknown[] = [];
      for (const x of v) {
        const r = walk(x, `${path}[]`, st);
        if (r !== DROP) out.push(r);
      }
      return out;
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(v as object)) {
      if (!KEY_RE.test(key) || key === '__proto__') {
        note(st, path ? `${path}.<invalid-key>` : '<invalid-key>', 'missing');
        st.cls = maxClass(st.cls, 'P3');
        continue;
      }
      const r = walk((v as Record<string, unknown>)[key], path ? `${path}.${key}` : key, st);
      if (r !== DROP) out[key] = r;
    }
    return out;
  }
  return leaf(v, path, st);
}

function resolveMap(schema: string | ClassificationMap, ctx: RedactionContext): { map: ClassificationMap; missing: AppError | undefined } {
  if (typeof schema !== 'string') return { map: schema, missing: undefined };
  const loaded = (ctx.registry ?? defaultClassificationRegistry).load(schema);
  return loaded.ok ? { map: loaded.value, missing: undefined } : { map: { schema, fields: {} }, missing: loaded.error };
}

interface Run {
  readonly result: RedactionResult;
  readonly altered: readonly string[];
}

function run(record: unknown, schema: string | ClassificationMap, requested: Sink | undefined, ctx: RedactionContext): Run {
  // Omitted or unknown sinks default to the most restrictive one (public log).
  const sink: Sink = SINKS.includes(requested as Sink) ? (requested as Sink) : 'log';
  const refuse = (error: AppError, dropped: readonly string[] = [], cls: PrivacyClass = 'P3'): Run => ({ result: { value: null, dropped, refused: true, error, class: cls }, altered: [] });
  if (!withinBounds(record)) return refuse(appError('PAYLOAD_TOO_LARGE'));
  if (sink === 'federation' && ctx.optIn !== true) return refuse(modelErrors.make('PRIVACY_SINK_FORBIDDEN', { params: { reason: 'federation_opt_in_missing' } }), [], 'P0');
  const { map, missing } = resolveMap(schema, ctx);
  const st: State = { map, sink, ctx, prefixes: prefixesOf(map), dropped: [], altered: [], cls: 'P0', firstCause: undefined, nodes: 0, fatal: undefined };
  let value: unknown;
  try {
    value = isPlain(record) || Array.isArray(record) ? walk(record, '', st) : leaf(record, '', st);
  } catch (e) {
    if (e instanceof RangeError) return refuse(appError('PAYLOAD_TOO_LARGE'));
    throw e;
  }
  if (value === DROP) value = null;
  if (missing) return { result: { value: null, dropped: st.dropped, refused: true, error: missing, class: 'P3' }, altered: st.altered };
  if (st.fatal) return { result: { value: null, dropped: st.dropped, refused: true, error: st.fatal, class: st.cls }, altered: st.altered };
  if (ctx.strict === true && (st.dropped.length > 0 || st.altered.length > 0)) {
    const code = st.firstCause === 'missing' ? 'PRIVACY_CLASSIFICATION_MISSING' : st.firstCause === 'location' ? 'PRIVACY_LOCATION_TOO_PRECISE' : 'PRIVACY_SINK_FORBIDDEN';
    return { result: { value: null, dropped: [...st.dropped, ...st.altered], refused: true, error: modelErrors.make(code, { fields: [...st.dropped, ...st.altered].map((path) => ({ path, code: 'REDACTED' })) }), class: st.cls }, altered: st.altered };
  }
  return { result: { value, dropped: st.dropped, class: st.cls }, altered: st.altered };
}

const defaults = (ctx: RedactionContext | undefined): RedactionContext => ctx ?? {};

/** Safe copy for logs; dropped fields become `[redacted:Pn]`, free text loses emails, phone numbers and full IPv4 addresses. */
export const redactForLog = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'log', defaults(ctx)).result;
export const redactForEvent = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'event', defaults(ctx)).result;
export const redactForFederation = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'federation', defaults(ctx)).result;
export const redactForNotification = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'notification', defaults(ctx)).result;
export const redactForProjection = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'projection', defaults(ctx)).result;
export const redactForExport = (record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, 'export', defaults(ctx)).result;
/** Generic entry for the remaining sinks (ui_public, ui_participant, ui_owner). */
export const redactFor = (sink: Sink | undefined, record: unknown, schema: string | ClassificationMap, ctx?: RedactionContext): RedactionResult => run(record, schema, sink, defaults(ctx)).result;

/** Test helper: throws, naming only paths, when the value would not pass unchanged to the sink. */
export function assertSinkSafe(value: unknown, schema: string | ClassificationMap, sink: Sink | undefined, ctx: RedactionContext = {}): void {
  const { result, altered } = run(value, schema, sink, { ...ctx, strict: false });
  const paths = [...result.dropped, ...altered];
  if (result.refused) paths.push(result.error?.code ?? 'refused');
  if (paths.length > 0) throw new Error(`assertSinkSafe: not safe for sink ${sink ?? 'log'}: ${[...new Set(paths)].join(', ')}`);
}
