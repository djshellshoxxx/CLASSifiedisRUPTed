// F15.S04.M01 generation pipeline: parse planning/modules.yaml, merge module.spec.yaml scope and depends_on,
// validate, order, canonicalize and hash, render, then write atomically. File access is injected (RegistryIo)
// so that the same pipeline runs from packages/platform/scripts/gen-registry.mjs, CI and tests.
import { appError, canonicalJson, err, ok, z, type AppError, type Result } from '@classrup/kernel';
import { buildRegistryBody, contentDigest, featureErrors, finalizeRegistry } from './rules.ts';
import { MAX_REGISTRY_BYTES, type CatalogFeature, type CatalogInput, type CatalogModule, type Registry } from './schema.ts';

export const CATALOG_PATH = 'planning/modules.yaml';
export const REGISTRY_OUTPUT_PATH = 'packages/platform/src/configuration/feature/registry.generated.ts';

export type PipelineStep = 'parse' | 'merge' | 'validate' | 'hash' | 'render' | 'write';

/** Repository-relative file access used by the pipeline. */
export interface RegistryIo {
  readText(path: string): string | undefined;
  parseYaml(text: string): unknown;
}

/** Writes a file atomically (temp file then rename); a failure must leave the previous file untouched. */
export interface RegistryWriter {
  writeAtomic(path: string, text: string): void;
}

export interface GenerationSummary {
  readonly features: number;
  readonly modules: number;
  readonly edges: number;
  readonly bytes: number;
  readonly specsMissing: number;
  readonly hash: string;
}

export interface GenerationOutput {
  readonly registry: Registry;
  readonly text: string;
  readonly summary: GenerationSummary;
}

const catalogShape = z.object({
  modules: z.array(z.object({ id: z.string(), title: z.string(), code: z.string(), path: z.string(), surface: z.string().optional() })),
});

const FEATURE_HEADER_RE = /^#\s*-+\s*(F\d{2})\s+(.+?)\s+\(slug\s+([a-z0-9_]+)\)\s*-+\s*$/gm;

function failAt(step: PipelineStep, e: AppError): AppError {
  return { ...e, params: { ...e.params, step } };
}

function stepError(step: PipelineStep, path: string, code: string): AppError {
  return appError('VALIDATION_FAILED', { fields: [{ path, code }], params: { step } });
}

function parseYaml(io: RegistryIo, text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: io.parseYaml(text) };
  } catch {
    return { ok: false };
  }
}

/** Feature headers of the catalog (`# ---- F01 LocalBazaar (slug bazaar) ----`). */
export function parseFeatureHeaders(text: string): CatalogFeature[] {
  return [...text.matchAll(FEATURE_HEADER_RE)].map((m) => ({ id: m[1] as string, title: (m[2] as string).trim(), slug: m[3] as string }));
}

export function specPathOf(modulePath: string): string {
  return `${modulePath}/module.spec.yaml`;
}

/** Steps parse and merge: reads the catalog and every module spec into a CatalogInput. */
export async function loadCatalog(io: RegistryIo): Promise<Result<CatalogInput, AppError>> {
  const text = io.readText(CATALOG_PATH);
  if (text === undefined) return err(stepError('parse', CATALOG_PATH, 'MISSING'));
  const doc = parseYaml(io, text);
  if (!doc.ok) return err(stepError('parse', CATALOG_PATH, 'YAML_INVALID'));
  const shape = catalogShape.safeParse(doc.value);
  if (!shape.success) return err(stepError('parse', CATALOG_PATH, 'INVALID_CATALOG'));
  const sources: [string, string | null][] = [[CATALOG_PATH, text]];
  const modules: CatalogModule[] = [];
  for (const m of shape.data.modules) {
    const path = specPathOf(m.path);
    const specText = io.readText(path);
    sources.push([path, specText ?? null]);
    let spec: CatalogModule['spec'];
    if (specText !== undefined) {
      const parsed = parseYaml(io, specText);
      if (!parsed.ok || typeof parsed.value !== 'object' || parsed.value === null) return err(stepError('merge', path, 'YAML_INVALID'));
      const s = parsed.value as Record<string, unknown>;
      spec = { scope: s['scope'], dependsOn: s['depends_on'] };
    }
    modules.push({ id: m.id, title: m.title, code: m.code, path: m.path, ...(m.surface === undefined ? {} : { surface: m.surface }), spec });
  }
  return ok({ features: parseFeatureHeaders(text), modules, sourceDigest: await contentDigest(sources) });
}

/** The generated TypeScript module: one record per line, byte-identical for identical input. */
export function renderRegistryModule(registry: Registry): string {
  return [
    '// GENERATED FILE (F15.S04.M01 feature registry). Do not edit by hand.',
    '// Regenerate with `node packages/platform/scripts/gen-registry.mjs` after changing planning/modules.yaml or a',
    '// module.spec.yaml; CI runs it with --check and fails with PLATFORM_FEATURE_REGISTRY_STALE when this file is stale.',
    "import type { Registry } from './schema.ts';",
    '',
    'export const GENERATED_REGISTRY: Registry = {',
    `  version: ${registry.version},`,
    `  generatedFrom: ${JSON.stringify(registry.generatedFrom)},`,
    '  features: [',
    ...registry.features.map((f) => `    ${JSON.stringify(f)},`),
    '  ],',
    '  modules: [',
    ...registry.modules.map((m) => `    ${JSON.stringify(m)},`),
    '  ],',
    `  order: ${JSON.stringify(registry.order)},`,
    `  hash: ${JSON.stringify(registry.hash)},`,
    '};',
    '',
  ].join('\n');
}

function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function summaryLine(s: GenerationSummary): string {
  return `registry: ${s.features} features, ${s.modules} modules, ${s.edges} edges, acyclic, ${s.specsMissing} specs missing, ${s.bytes} bytes, hash ${s.hash}`;
}

/** Steps validate, order, hash and render for an already loaded catalog. */
export async function generateFromCatalog(catalog: CatalogInput, opts: { readonly strict?: boolean } = {}): Promise<Result<GenerationOutput, AppError>> {
  const body = buildRegistryBody(catalog, opts);
  if (!body.ok) return err(failAt('validate', body.error));
  const registry = await finalizeRegistry(body.value);
  const bytes = utf8Length(canonicalJson(registry));
  if (bytes > MAX_REGISTRY_BYTES) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'registry', code: 'TOO_BIG' }], params: { step: 'render', bytes, max: MAX_REGISTRY_BYTES } }));
  const summary: GenerationSummary = {
    features: registry.features.length,
    modules: registry.modules.length,
    edges: registry.modules.reduce((n, m) => n + m.dependsOn.length, 0),
    bytes,
    specsMissing: registry.modules.filter((m) => !m.dependsOnKnown).length,
    hash: registry.hash,
  };
  return ok({ registry, text: renderRegistryModule(registry), summary });
}

/** Full generation without writing: parse, merge, validate, order, canonicalize and hash, render. */
export async function generateRegistry(io: RegistryIo, opts: { readonly strict?: boolean } = {}): Promise<Result<GenerationOutput, AppError>> {
  const catalog = await loadCatalog(io);
  if (!catalog.ok) return catalog;
  return generateFromCatalog(catalog.value, opts);
}

/** V05: the checked-in file equals a fresh generation. */
export function checkStale(existing: string | undefined, fresh: string): Result<void, AppError> {
  return existing === fresh ? ok(undefined) : err(featureErrors.make('PLATFORM_FEATURE_REGISTRY_STALE', { params: { path: REGISTRY_OUTPUT_PATH, present: existing !== undefined } }));
}

export interface RunOptions {
  readonly strict?: boolean;
  /** Compare with the checked-in file instead of writing. */
  readonly check?: boolean;
  readonly out?: string;
}

/**
 * Runs the pipeline; any failing step prevents writing, and the writer replaces the output atomically,
 * so a failed run leaves the previous file untouched and publishes nothing.
 */
export async function runGeneration(io: RegistryIo & RegistryWriter, opts: RunOptions = {}): Promise<Result<{ summary: GenerationSummary; written: boolean }, AppError>> {
  const out = opts.out ?? REGISTRY_OUTPUT_PATH;
  const gen = await generateRegistry(io, opts);
  if (!gen.ok) return gen;
  if (opts.check) {
    const stale = checkStale(io.readText(out), gen.value.text);
    return stale.ok ? ok({ summary: gen.value.summary, written: false }) : stale;
  }
  try {
    io.writeAtomic(out, gen.value.text);
  } catch {
    return err(appError('INTERNAL', { params: { step: 'write', path: out } }));
  }
  return ok({ summary: gen.value.summary, written: true });
}
