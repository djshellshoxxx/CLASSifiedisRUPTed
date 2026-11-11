// F15.S04.M01 Feature registry: shape of the generated registry, catalog input and query inputs/outputs.
// The registry is generated static data (no persisted entity); see module.spec.yaml processes.domain_schema.
import { z } from '@classrup/kernel';

export const FEATURE_MODULE_ID = 'F15.S04.M01';
export const REGISTRY_VERSION = 1;
export const MODULE_ID_RE = /^F[0-9]{2}\.S[0-9]{2}\.M[0-9]{2}$/;
export const FEATURE_ID_RE = /^F[0-9]{2}$/;
export const CONTRACT_ID_RE = /^CTR-[A-Z]+-[0-9]{3}$/;
/** Core features are not switchable off (FLG-4, V07). */
export const CORE_FEATURES: readonly string[] = ['F15', 'F16'];
/** Registry hash and source digest: `sha256-` + base64url(SHA-256) (43 characters). */
export const DIGEST_RE = /^sha256-[A-Za-z0-9_-]{43}$/;
/** Generation fails above 512 KiB raw so that the initial JS budget is protected. */
export const MAX_REGISTRY_BYTES = 512 * 1024;

export const surfaceSchema = z.enum(['vault', 'relay', 'both']);
export const moduleScopeSchema = z.enum(['MVP', 'FUTURE']);
export const defaultStateSchema = z.enum(['on', 'off']);
export type Surface = z.output<typeof surfaceSchema>;
export type ModuleScope = z.output<typeof moduleScopeSchema>;
export type DefaultState = z.output<typeof defaultStateSchema>;

export const featureRecordSchema = z.object({
  id: z.string().regex(FEATURE_ID_RE),
  slug: z.string(),
  title: z.string(),
  core: z.boolean(),
});

export const moduleRecordSchema = z.object({
  id: z.string().regex(MODULE_ID_RE),
  feature: z.string().regex(FEATURE_ID_RE),
  title: z.string(),
  scope: moduleScopeSchema,
  surface: surfaceSchema,
  defaultState: defaultStateSchema,
  registered: z.boolean(),
  core: z.boolean(),
  /** Module IDs only; CTR-* entries are kept apart in `contracts`. */
  dependsOn: z.array(z.string()),
  /** False when module.spec.yaml is missing: such a module is off, unregistered and never switchable on. */
  dependsOnKnown: z.boolean(),
  dependents: z.array(z.string()),
  contracts: z.array(z.string()),
});

export const registryBodySchema = z.object({
  version: z.literal(REGISTRY_VERSION),
  generatedFrom: z.string().regex(DIGEST_RE),
  features: z.array(featureRecordSchema),
  modules: z.array(moduleRecordSchema),
  /** Topological order: dependencies before dependents. */
  order: z.array(z.string()),
});

export const registrySchema = registryBodySchema.extend({ hash: z.string().regex(DIGEST_RE) });

export type FeatureRecord = z.output<typeof featureRecordSchema>;
export type ModuleRecord = z.output<typeof moduleRecordSchema>;
export type RegistryBody = z.output<typeof registryBodySchema>;
export type Registry = z.output<typeof registrySchema>;

/** One catalog entry of planning/modules.yaml merged with its module.spec.yaml (undefined when the spec is missing). */
export interface CatalogModule {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly path: string;
  /** Explicit surface (fixtures); when present it must equal the value derived from `code` (V08). */
  readonly surface?: string;
  readonly spec: { readonly scope: unknown; readonly dependsOn: unknown } | undefined;
}

export interface CatalogFeature {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
}

export interface CatalogInput {
  readonly features: readonly CatalogFeature[];
  readonly modules: readonly CatalogModule[];
  /** Digest of the generation sources (planning/modules.yaml and every module.spec.yaml). */
  readonly sourceDigest: string;
}

const keySchema = z.string().refine((v) => MODULE_ID_RE.test(v) || FEATURE_ID_RE.test(v), { params: { code: 'INVALID_KEY' } });

export const listFeaturesInput = z.strictObject({
  featureId: z.string().regex(FEATURE_ID_RE).optional(),
  includeFuture: z.boolean().default(false),
  surface: z.enum(['vault', 'relay']).optional(),
});
export const getDependenciesInput = z.strictObject({ key: keySchema, transitive: z.boolean().default(true) });
export const getOrderInput = z.strictObject({});
export const verifyHashInput = z.strictObject({ hash: z.string().regex(DIGEST_RE) });

export const listFeaturesOutput = z.strictObject({
  version: z.literal(REGISTRY_VERSION),
  hash: z.string(),
  features: z.array(featureRecordSchema),
  modules: z.array(moduleRecordSchema),
});
export const getDependenciesOutput = z.strictObject({
  key: z.string(),
  dependsOn: z.array(z.string()),
  dependents: z.array(z.string()),
  contracts: z.array(z.string()),
});
export const getOrderOutput = z.strictObject({ order: z.array(z.string()) });
export const verifyHashOutput = z.strictObject({ match: z.boolean(), localHash: z.string() });

export type ListFeaturesInput = z.input<typeof listFeaturesInput>;
export type GetDependenciesInput = z.input<typeof getDependenciesInput>;
export type ListFeaturesOutput = z.output<typeof listFeaturesOutput>;
export type GetDependenciesOutput = z.output<typeof getDependenciesOutput>;
