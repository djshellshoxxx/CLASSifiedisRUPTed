// F15.S04.M01 pure rules: registry construction and validation (V01-V04, V07-V09), graph ordering,
// content digests and the read-only registry queries (V06). No I/O; generate.ts runs the pipeline.
import { appError, canonicalJson, defineErrors, err, ok, sha256Hex, type AppError, type FieldIssue, type Result } from '@classrup/kernel';
import {
  CONTRACT_ID_RE,
  CORE_FEATURES,
  FEATURE_ID_RE,
  MODULE_ID_RE,
  REGISTRY_VERSION,
  type CatalogInput,
  type CatalogModule,
  type FeatureRecord,
  type GetDependenciesOutput,
  type ListFeaturesOutput,
  type ModuleRecord,
  type ModuleScope,
  type Registry,
  type RegistryBody,
  type Surface,
} from './schema.ts';

export const featureErrors = defineErrors({
  PLATFORM_FEATURE_CYCLE: { status: 422, retryable: false },
  PLATFORM_FEATURE_UNKNOWN_DEPENDENCY: { status: 422, retryable: false },
  PLATFORM_FEATURE_DEFAULT_VIOLATION: { status: 422, retryable: false },
  PLATFORM_FEATURE_REGISTRY_STALE: { status: 422, retryable: false },
  PLATFORM_FEATURE_SPEC_MISSING: { status: 422, retryable: false },
});

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Unpadded base64url of the bytes given as lowercase hex (encoding only, no cryptography). */
export function hexToBase64url(hex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i + 1 < hex.length; i += 2) bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64URL[b0 >> 2];
    out += B64URL[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 !== undefined) out += B64URL[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 !== undefined) out += B64URL[b2 & 63];
  }
  return out;
}

/** `sha256-` + base64url(SHA-256(text as UTF-8)). */
export async function textDigest(text: string): Promise<string> {
  return `sha256-${hexToBase64url(await sha256Hex(text))}`;
}

/** Content digest over RFC 8785 canonical JSON of a JSON value. */
export function contentDigest(value: unknown): Promise<string> {
  return textDigest(canonicalJson(value));
}

/** Surface derived from the catalog code path (V08): apps/pwa → vault, apps/relay → relay, otherwise both. */
export function surfaceOf(code: string): Surface | undefined {
  if (code.length === 0 || code.startsWith('/') || code.split('/').some((s) => s === '..' || s === '')) return undefined;
  if (code === 'apps/pwa' || code.startsWith('apps/pwa/')) return 'vault';
  if (code === 'apps/relay' || code.startsWith('apps/relay/')) return 'relay';
  return 'both';
}

export function isCoreFeature(featureId: string): boolean {
  return CORE_FEATURES.includes(featureId);
}

function invalid(fields: FieldIssue[], params?: Record<string, unknown>): AppError {
  return appError('VALIDATION_FAILED', { fields, ...(params ? { params } : {}) });
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function insertSorted(list: string[], value: string): void {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((list[mid] ?? '') < value) lo = mid + 1;
    else hi = mid;
  }
  list.splice(lo, 0, value);
}

/**
 * Kahn topological sort with a lexicographically ordered ready set (stable output). Dependencies come
 * before dependents; `cyclic` lists the nodes that could not be ordered (on or behind a cycle).
 */
export function topologicalOrder(ids: readonly string[], depsOf: (id: string) => readonly string[]): { order: string[]; cyclic: string[] } {
  const known = new Set(ids);
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of ids) indegree.set(id, 0);
  for (const id of ids) {
    for (const dep of new Set(depsOf(id))) {
      if (!known.has(dep)) continue;
      indegree.set(id, (indegree.get(id) ?? 0) + 1);
      const list = dependents.get(dep);
      if (list) list.push(id);
      else dependents.set(dep, [id]);
    }
  }
  const ready = [...ids].filter((id) => indegree.get(id) === 0).sort();
  const order: string[] = [];
  while (ready.length > 0) {
    const next = ready.shift() as string;
    order.push(next);
    for (const d of dependents.get(next) ?? []) {
      const left = (indegree.get(d) ?? 0) - 1;
      indegree.set(d, left);
      if (left === 0) insertSorted(ready, d);
    }
  }
  const placed = new Set(order);
  return { order, cyclic: [...ids].filter((id) => !placed.has(id)).sort() };
}

/** A cycle among the unordered nodes, rotated to start at its smallest ID and closed: [A, B, C, A]. */
export function findCycle(cyclic: readonly string[], depsOf: (id: string) => readonly string[]): string[] {
  const left = new Set(cyclic);
  const start = [...left].sort()[0];
  if (start === undefined) return [];
  const path: string[] = [];
  const seen = new Map<string, number>();
  let node: string | undefined = start;
  while (node !== undefined && !seen.has(node)) {
    seen.set(node, path.length);
    path.push(node);
    node = [...new Set(depsOf(node))].filter((d) => left.has(d)).sort()[0];
  }
  if (node === undefined) return [];
  const cycle = path.slice(seen.get(node));
  const min = [...cycle].sort()[0] as string;
  const at = cycle.indexOf(min);
  const rotated = [...cycle.slice(at), ...cycle.slice(0, at)];
  return [...rotated, min];
}

interface MergedModule {
  readonly entry: CatalogModule;
  readonly feature: string;
  readonly surface: Surface;
  readonly scope: ModuleScope;
  readonly known: boolean;
  readonly dependsOn: string[];
  readonly contracts: string[];
}

function checkIds(input: CatalogInput): Result<void, AppError> {
  const fields: FieldIssue[] = [];
  const featureIds = new Set<string>();
  input.features.forEach((f, i) => {
    if (!FEATURE_ID_RE.test(f.id)) fields.push({ path: `features.${i}.id`, code: 'INVALID_FEATURE_ID' });
    else if (featureIds.has(f.id)) fields.push({ path: `features.${i}.id`, code: 'DUPLICATE' });
    featureIds.add(f.id);
  });
  const moduleIds = new Set<string>();
  input.modules.forEach((m, i) => {
    if (!MODULE_ID_RE.test(m.id)) fields.push({ path: `modules.${i}.id`, code: 'INVALID_MODULE_ID' });
    else if (moduleIds.has(m.id)) fields.push({ path: `modules.${i}.id`, code: 'DUPLICATE' });
    else if (!featureIds.has(m.id.slice(0, 3))) fields.push({ path: `modules.${i}.id`, code: 'UNKNOWN_FEATURE' });
    moduleIds.add(m.id);
  });
  return fields.length ? err(invalid(fields, { rule: 'V01' })) : ok(undefined);
}

function checkSurfaces(input: CatalogInput): Result<Surface[], AppError> {
  const fields: FieldIssue[] = [];
  const out: Surface[] = [];
  input.modules.forEach((m, i) => {
    const derived = surfaceOf(m.code);
    if (derived === undefined) fields.push({ path: `modules.${i}.code`, code: 'INVALID_CODE_PATH' });
    else if (m.surface !== undefined && m.surface !== derived) fields.push({ path: `modules.${i}.surface`, code: 'SURFACE_MISMATCH' });
    out.push(derived ?? 'both');
  });
  return fields.length ? err(invalid(fields, { rule: 'V08' })) : ok(out);
}

function mergeSpecs(input: CatalogInput, surfaces: readonly Surface[], strict: boolean): Result<MergedModule[], AppError> {
  const missing = input.modules.filter((m) => m.spec === undefined).map((m) => m.id);
  if (strict && missing.length > 0) return err(featureErrors.make('PLATFORM_FEATURE_SPEC_MISSING', { params: { modules: missing.sort() } }));
  const fields: FieldIssue[] = [];
  const merged = input.modules.map((entry, i): MergedModule => {
    const base = { entry, feature: entry.id.slice(0, 3), surface: surfaces[i] ?? 'both' };
    if (entry.spec === undefined) return { ...base, scope: 'MVP', known: false, dependsOn: [], contracts: [] };
    const scope = entry.spec.scope;
    if (scope !== 'MVP' && scope !== 'FUTURE') fields.push({ path: `modules.${i}.scope`, code: 'INVALID_SCOPE' });
    const raw = entry.spec.dependsOn ?? [];
    const list = Array.isArray(raw) && raw.every((x) => typeof x === 'string') ? (raw as string[]) : undefined;
    if (!list) fields.push({ path: `modules.${i}.depends_on`, code: 'INVALID_TYPE' });
    const tokens = (list ?? []).map((t) => t.trim());
    return {
      ...base,
      scope: scope === 'FUTURE' ? 'FUTURE' : 'MVP',
      known: true,
      dependsOn: sortedUnique(tokens.filter((t) => !CONTRACT_ID_RE.test(t))),
      contracts: sortedUnique(tokens.filter((t) => CONTRACT_ID_RE.test(t))),
    };
  });
  return fields.length ? err(invalid(fields, { rule: 'V01' })) : ok(merged);
}

function checkDependencies(merged: readonly MergedModule[]): Result<void, AppError> {
  const ids = new Set(merged.map((m) => m.entry.id));
  const pairs: string[] = [];
  for (const m of merged) for (const d of m.dependsOn) if (d === m.entry.id || !ids.has(d)) pairs.push(`${m.entry.id} -> ${d}`);
  return pairs.length ? err(featureErrors.make('PLATFORM_FEATURE_UNKNOWN_DEPENDENCY', { params: { pairs: pairs.sort() } })) : ok(undefined);
}

function defaultOf(m: MergedModule): 'on' | 'off' {
  return m.known && m.scope === 'MVP' ? 'on' : 'off';
}

function checkDefaults(merged: readonly MergedModule[]): Result<void, AppError> {
  const coreOff = merged.filter((m) => isCoreFeature(m.feature) && defaultOf(m) === 'off').map((m) => m.entry.id);
  if (coreOff.length > 0) return err(featureErrors.make('PLATFORM_FEATURE_DEFAULT_VIOLATION', { params: { rule: 'V07', coreModulesOff: coreOff.sort() } }));
  const byId = new Map(merged.map((m) => [m.entry.id, m]));
  const pairs: string[] = [];
  for (const m of merged) {
    if (defaultOf(m) !== 'on') continue;
    for (const d of m.dependsOn) {
      const dep = byId.get(d);
      if (!dep || defaultOf(dep) !== 'on') pairs.push(`${m.entry.id} -> ${d}`);
    }
  }
  return pairs.length ? err(featureErrors.make('PLATFORM_FEATURE_DEFAULT_VIOLATION', { params: { rule: 'V04', pairs: pairs.sort() } })) : ok(undefined);
}

/**
 * Builds and validates the registry body (everything but the hash). Checks run in pipeline order:
 * V01 IDs, V08 surfaces, V09 specs (strict), V02 dependencies, V03 acyclicity, V07 and V04 defaults.
 */
export function buildRegistryBody(input: CatalogInput, opts: { readonly strict?: boolean } = {}): Result<RegistryBody, AppError> {
  const ids = checkIds(input);
  if (!ids.ok) return ids;
  const surfaces = checkSurfaces(input);
  if (!surfaces.ok) return surfaces;
  const mergedR = mergeSpecs(input, surfaces.value, opts.strict === true);
  if (!mergedR.ok) return mergedR;
  const merged = mergedR.value;
  const deps = checkDependencies(merged);
  if (!deps.ok) return deps;
  const byId = new Map(merged.map((m) => [m.entry.id, m]));
  const depsOf = (id: string): readonly string[] => byId.get(id)?.dependsOn ?? [];
  const ids2 = merged.map((m) => m.entry.id);
  const topo = topologicalOrder(ids2, depsOf);
  if (topo.cyclic.length > 0) return err(featureErrors.make('PLATFORM_FEATURE_CYCLE', { params: { cycle: findCycle(topo.cyclic, depsOf) } }));
  const defaults = checkDefaults(merged);
  if (!defaults.ok) return defaults;
  const dependents = new Map<string, string[]>();
  for (const m of merged) for (const d of m.dependsOn) dependents.set(d, [...(dependents.get(d) ?? []), m.entry.id]);
  const features: FeatureRecord[] = [...input.features]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((f) => ({ id: f.id, slug: f.slug, title: f.title, core: isCoreFeature(f.id) }));
  const modules: ModuleRecord[] = [...merged]
    .sort((a, b) => (a.entry.id < b.entry.id ? -1 : 1))
    .map((m) => ({
      id: m.entry.id,
      feature: m.feature,
      title: m.entry.title,
      scope: m.scope,
      surface: m.surface,
      defaultState: defaultOf(m),
      registered: defaultOf(m) === 'on',
      core: isCoreFeature(m.feature),
      dependsOn: m.dependsOn,
      dependsOnKnown: m.known,
      dependents: sortedUnique(dependents.get(m.entry.id) ?? []),
      contracts: m.contracts,
    }));
  return ok({ version: REGISTRY_VERSION, generatedFrom: input.sourceDigest, features, modules, order: topo.order });
}

/** Adds the content hash over RFC 8785 canonical JSON of the body. */
export async function finalizeRegistry(body: RegistryBody): Promise<Registry> {
  return { ...body, hash: await contentDigest(body) };
}

export async function buildRegistry(input: CatalogInput, opts: { readonly strict?: boolean } = {}): Promise<Result<Registry, AppError>> {
  const body = buildRegistryBody(input, opts);
  return body.ok ? ok(await finalizeRegistry(body.value)) : body;
}

// ---------------------------------------------------------------- registry index and queries (V06)

export interface RegistryIndex {
  readonly registry: Registry;
  readonly modules: ReadonlyMap<string, ModuleRecord>;
  readonly features: ReadonlyMap<string, FeatureRecord>;
  readonly modulesOf: ReadonlyMap<string, readonly ModuleRecord[]>;
  readonly position: ReadonlyMap<string, number>;
}

const indexes = new WeakMap<Registry, RegistryIndex>();

export function indexRegistry(registry: Registry): RegistryIndex {
  const hit = indexes.get(registry);
  if (hit) return hit;
  const modulesOf = new Map<string, ModuleRecord[]>();
  for (const m of registry.modules) modulesOf.set(m.feature, [...(modulesOf.get(m.feature) ?? []), m]);
  const idx: RegistryIndex = {
    registry,
    modules: new Map(registry.modules.map((m) => [m.id, m])),
    features: new Map(registry.features.map((f) => [f.id, f])),
    modulesOf,
    position: new Map(registry.order.map((id, i) => [id, i])),
  };
  indexes.set(registry, idx);
  return idx;
}

export function isKnownKey(registry: Registry, key: string): boolean {
  const idx = indexRegistry(registry);
  return idx.modules.has(key) || idx.features.has(key);
}

export function listFeatures(registry: Registry, input: { readonly featureId?: string | undefined; readonly includeFuture: boolean; readonly surface?: 'vault' | 'relay' | undefined }): Result<ListFeaturesOutput, AppError> {
  const idx = indexRegistry(registry);
  if (input.featureId !== undefined && !idx.features.has(input.featureId)) return err(appError('NOT_FOUND'));
  const inFeature = (id: string) => input.featureId === undefined || id === input.featureId;
  const onSurface = (s: Surface) => input.surface === undefined || s === 'both' || s === input.surface;
  return ok({
    version: REGISTRY_VERSION,
    hash: registry.hash,
    features: registry.features.filter((f) => inFeature(f.id)).map((f) => ({ ...f })),
    modules: registry.modules
      .filter((m) => inFeature(m.feature) && onSurface(m.surface) && (input.includeFuture || m.scope !== 'FUTURE'))
      .map((m) => ({ ...m, dependsOn: [...m.dependsOn], dependents: [...m.dependents], contracts: [...m.contracts] })),
  });
}

function closure(start: readonly string[], next: (id: string) => readonly string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...start];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    for (const n of next(id)) {
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(n);
    }
  }
  return seen;
}

export function getDependencies(registry: Registry, input: { readonly key: string; readonly transitive: boolean }): Result<GetDependenciesOutput, AppError> {
  const idx = indexRegistry(registry);
  const mod = idx.modules.get(input.key);
  const own = mod ? [mod] : idx.features.has(input.key) ? [...(idx.modulesOf.get(input.key) ?? [])] : undefined;
  if (own === undefined) return err(appError('NOT_FOUND'));
  const members = new Set(own.map((m) => m.id));
  const depsOf = (id: string) => idx.modules.get(id)?.dependsOn ?? [];
  const dependentsOf = (id: string) => idx.modules.get(id)?.dependents ?? [];
  const pick = (next: (id: string) => readonly string[]): string[] => {
    const found = input.transitive ? closure([...members], next) : new Set([...members].flatMap((id) => next(id)));
    return [...found].filter((id) => !members.has(id)).sort();
  };
  return ok({ key: input.key, dependsOn: pick(depsOf), dependents: pick(dependentsOf), contracts: sortedUnique(own.flatMap((m) => m.contracts)) });
}

export function getOrder(registry: Registry): { order: string[] } {
  return { order: [...registry.order] };
}

export function verifyHash(registry: Registry, hash: string): { match: boolean; localHash: string } {
  return { match: hash === registry.hash, localHash: registry.hash };
}

export interface RegistryDiff {
  readonly match: boolean;
  /** Modules the remote registry lists that this release does not know (shown, never fatal). */
  readonly unknownModules: readonly string[];
  /** Modules of this release that the remote registry does not list. */
  readonly missingModules: readonly string[];
}

/** Informational comparison with a registry of another release (T03 drift: notice, never an error). */
export function diffRegistry(local: Registry, remote: { readonly hash: string; readonly modules: readonly string[] }): RegistryDiff {
  const mine = new Set(local.modules.map((m) => m.id));
  const theirs = new Set(remote.modules);
  return {
    match: remote.hash === local.hash,
    unknownModules: [...theirs].filter((id) => !mine.has(id)).sort(),
    missingModules: [...mine].filter((id) => !theirs.has(id)).sort(),
  };
}

/** Manifest entry recorded in vault exports for diagnostics (CTR-IOX-001 IOX-1 modules[]); the registry itself is never exported. */
export function registryManifestEntry(registry: Registry): { readonly version: number; readonly hash: string } {
  return { version: registry.version, hash: registry.hash };
}

/** Recursively freezes generated data so that no runtime path can mutate the compiled-in registry. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}
