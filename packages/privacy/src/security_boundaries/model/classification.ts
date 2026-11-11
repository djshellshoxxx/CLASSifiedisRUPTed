// Classification maps: format, validation, registry, path derivation from zod schemas and the CI lint.
import { appError, err, ok, z, type AppError, type Result } from '@classrup/kernel';
import { isLocationLevel, isPrivacyClass, maxClass, MODEL_MAJOR, type LocationLevel, type PrivacyClass, type RedactionStrategy } from './classes.ts';
import { modelErrors } from './errors.ts';

export const MAX_MAP_PATHS = 10_000;
const PATH_RE = /^[A-Za-z0-9_$-]+(?:\[\])*(?:\.[A-Za-z0-9_$-]+(?:\[\])*)*$/;
const STRATEGIES: readonly string[] = ['drop', 'hash', 'truncate', 'snap'];

export interface FieldClassification {
  readonly class: PrivacyClass;
  /** Finest location precision the field carries; present only on location fields. */
  readonly level?: LocationLevel;
  readonly redact?: RedactionStrategy;
}

/** Path syntax: `a.b`, arrays as `items[]`, nested arrays `m[][]`. */
export interface ClassificationMap {
  readonly schema: string;
  readonly fields: Readonly<Record<string, FieldClassification>>;
  /** Library major the map was written for; absent means 1. */
  readonly libraryMajor?: number;
}

const rawMapSchema = z.strictObject({
  schema: z.string().min(3).max(200),
  libraryMajor: z.int().min(1).optional(),
  fields: z.record(z.string(), z.strictObject({ class: z.string(), level: z.string().optional(), redact: z.string().optional() })),
});

const invalid = (path: string, code: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path, code }] });

/** Parses and validates an untrusted map; unknown classes or levels need a library major bump and are refused. */
export function parseClassificationMap(raw: unknown): Result<ClassificationMap, AppError> {
  const parsed = rawMapSchema.safeParse(raw);
  if (!parsed.success) return err(invalid('map', 'SHAPE'));
  const m = parsed.data;
  if ((m.libraryMajor ?? 1) > MODEL_MAJOR) return err(appError('UNSUPPORTED_SCHEMA_VERSION', { params: { requiresMajor: m.libraryMajor ?? 1, supportedMajor: MODEL_MAJOR } }));
  const entries = Object.entries(m.fields);
  if (entries.length > MAX_MAP_PATHS) return err(appError('PAYLOAD_TOO_LARGE'));
  const fields: Record<string, FieldClassification> = {};
  for (const [path, f] of entries) {
    if (!PATH_RE.test(path)) return err(invalid(`fields.${path.slice(0, 40)}`, 'PATH_SYNTAX'));
    if (!isPrivacyClass(f.class)) return err(invalid(`fields.${path}.class`, 'UNKNOWN_CLASS_REQUIRES_MAJOR'));
    if (f.level !== undefined && !isLocationLevel(f.level)) return err(invalid(`fields.${path}.level`, 'UNKNOWN_LEVEL_REQUIRES_MAJOR'));
    if (f.redact !== undefined && !STRATEGIES.includes(f.redact)) return err(invalid(`fields.${path}.redact`, 'UNKNOWN_STRATEGY'));
    fields[path] = { class: f.class, ...(f.level === undefined ? {} : { level: f.level as LocationLevel }), ...(f.redact === undefined ? {} : { redact: f.redact as RedactionStrategy }) };
  }
  return ok(Object.freeze({ schema: m.schema, fields: Object.freeze(fields), ...(m.libraryMajor === undefined ? {} : { libraryMajor: m.libraryMajor }) }));
}

/** Class of a path; unknown paths default to P3 (fail closed). Array elements inherit the array's entry. */
export function classOf(path: string, map: ClassificationMap): PrivacyClass {
  return lookup(map, path)?.class ?? 'P3';
}

export function lookup(map: ClassificationMap, path: string): FieldClassification | undefined {
  let p = path;
  for (;;) {
    if (Object.hasOwn(map.fields, p)) return map.fields[p];
    if (!p.endsWith('[]')) return undefined;
    p = p.slice(0, -2);
  }
}

/** V01 and V06: every schema path has an entry and no entry refers to a missing path. */
export function validateCoverage(map: ClassificationMap, schemaPaths: readonly string[]): Result<void, AppError> {
  const known = new Set(schemaPaths);
  const missing = schemaPaths.filter((p) => !Object.hasOwn(map.fields, p));
  if (missing.length > 0) return err(modelErrors.make('PRIVACY_CLASSIFICATION_MISSING', { fields: missing.map((path) => ({ path, code: 'UNCLASSIFIED' })) }));
  const extra = Object.keys(map.fields).filter((p) => !known.has(p));
  if (extra.length > 0) return err(appError('VALIDATION_FAILED', { fields: extra.map((path) => ({ path, code: 'NOT_IN_SCHEMA' })) }));
  return ok(undefined);
}

/** V02: an event payload is classified at least as high as its most sensitive field. */
export function checkEventClass(declared: PrivacyClass, payloadPaths: readonly string[], map: ClassificationMap): Result<PrivacyClass, AppError> {
  let max: PrivacyClass = 'P0';
  for (const p of payloadPaths) max = maxClass(max, classOf(p, map));
  if (maxClass(declared, max) !== declared) return err(modelErrors.make('PRIVACY_CLASSIFICATION_MISSING', { params: { declared, required: max } }));
  return ok(declared);
}

// ------------------------------------------------------------------ registry

export interface ClassificationRegistry {
  register(map: ClassificationMap): Result<void, AppError>;
  load(schemaId: string): Result<ClassificationMap, AppError>;
}

export function createClassificationRegistry(initial: readonly ClassificationMap[] = []): ClassificationRegistry {
  const maps = new Map<string, ClassificationMap>();
  const reg: ClassificationRegistry = {
    register(map) {
      const parsed = parseClassificationMap(map);
      if (!parsed.ok) return parsed;
      if (maps.has(parsed.value.schema)) return err(appError('CONFLICT_STATE', { params: { schema: parsed.value.schema } }));
      maps.set(parsed.value.schema, parsed.value);
      return ok(undefined);
    },
    load(schemaId) {
      const m = maps.get(schemaId);
      return m ? ok(m) : err(modelErrors.make('PRIVACY_CLASSIFICATION_MISSING', { params: { schema: schemaId.slice(0, 120) } }));
    },
  };
  for (const m of initial) reg.register(m);
  return reg;
}

/** Process-wide registry filled by module definitions at load time, like the schema registry it mirrors. */
export const defaultClassificationRegistry: ClassificationRegistry = createClassificationRegistry();

export function registerClassification(map: ClassificationMap, registry: ClassificationRegistry = defaultClassificationRegistry): Result<void, AppError> {
  return registry.register(map);
}

export function loadClassification(schemaId: string, registry: ClassificationRegistry = defaultClassificationRegistry): Result<ClassificationMap, AppError> {
  return registry.load(schemaId);
}

// ------------------------------------------------------------------ zod path derivation

type Def = { type?: string; shape?: Record<string, unknown>; element?: unknown; innerType?: unknown; in?: unknown; options?: readonly unknown[] };
function defOf(schema: unknown): Def {
  const s = schema as { _zod?: { def?: Def }; def?: Def };
  return s._zod?.def ?? s.def ?? {};
}

/** Leaf field paths of a zod schema in the map's path syntax; records and unions of non-objects are leaves. */
export function fieldPathsOfZod(schema: unknown, depth = 0): string[] {
  const out: string[] = [];
  const visit = (s: unknown, prefix: string, d: number): void => {
    const def = defOf(s);
    if (d > 16) return void out.push(prefix);
    switch (def.type) {
      case 'object':
        for (const [k, v] of Object.entries(def.shape ?? {})) visit(v, prefix ? `${prefix}.${k}` : k, d + 1);
        return;
      case 'array':
        return visit(def.element, `${prefix}[]`, d + 1);
      case 'optional': case 'nullable': case 'default': case 'prefault': case 'readonly': case 'nonoptional': case 'catch':
        return visit(def.innerType, prefix, d + 1);
      case 'pipe':
        return visit(def.in, prefix, d + 1);
      default:
        if (prefix) out.push(prefix);
    }
  };
  visit(schema, '', depth);
  return out;
}

// ------------------------------------------------------------------ CI lint

export interface LintEntry {
  readonly schema: string;
  readonly paths: readonly string[];
  readonly map: ClassificationMap | undefined;
  readonly events?: readonly { readonly type: string; readonly class: PrivacyClass; readonly payloadPaths: readonly string[] }[];
  readonly projections?: readonly { readonly name: string; readonly paths: readonly string[] }[];
}
export interface LintFinding {
  readonly code: 'PRIVACY_CLASSIFICATION_MISSING' | 'PRIVACY_SINK_FORBIDDEN' | 'VALIDATION_FAILED';
  readonly schema: string;
  readonly path: string;
  readonly detail: string;
}
export interface LintReport {
  readonly findings: readonly LintFinding[];
  readonly classified_fields_total: number;
  readonly unclassified_fields_total: number;
  readonly event_class_violations_total: number;
}

/** Fails (findings) on unannotated fields, extra map paths, event classes below their maximum field class and public projections with P1+ fields. */
export function lintClassification(entries: readonly LintEntry[]): LintReport {
  const findings: LintFinding[] = [];
  let classified = 0;
  let unclassified = 0;
  let eventViolations = 0;
  for (const e of entries) {
    if (!e.map) {
      for (const path of e.paths) findings.push({ code: 'PRIVACY_CLASSIFICATION_MISSING', schema: e.schema, path, detail: 'schema has no classification map' });
      unclassified += e.paths.length;
      continue;
    }
    const known = new Set(e.paths);
    for (const path of e.paths) {
      if (Object.hasOwn(e.map.fields, path)) classified++;
      else {
        unclassified++;
        findings.push({ code: 'PRIVACY_CLASSIFICATION_MISSING', schema: e.schema, path, detail: 'field has no classification' });
      }
    }
    for (const path of Object.keys(e.map.fields)) if (!known.has(path)) findings.push({ code: 'VALIDATION_FAILED', schema: e.schema, path, detail: 'classified path is not in the schema' });
    for (const ev of e.events ?? []) {
      const r = checkEventClass(ev.class, ev.payloadPaths, e.map);
      if (!r.ok) {
        eventViolations++;
        findings.push({ code: 'PRIVACY_CLASSIFICATION_MISSING', schema: e.schema, path: ev.type, detail: `event class ${ev.class} is below its most sensitive field` });
      }
    }
    for (const pr of e.projections ?? []) {
      for (const path of pr.paths) {
        if (classOf(path, e.map) !== 'P0') findings.push({ code: 'PRIVACY_SINK_FORBIDDEN', schema: e.schema, path, detail: `public projection ${pr.name} includes a field above P0` });
      }
    }
  }
  return { findings, classified_fields_total: classified, unclassified_fields_total: unclassified, event_class_violations_total: eventViolations };
}
