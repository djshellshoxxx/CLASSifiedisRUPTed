// F15.S04.M01 Feature registry — public API.
import { featureQueries } from './commands.ts';
import { featureErrors } from './rules.ts';
import { FEATURE_MODULE_ID } from './schema.ts';

export {
  CONTRACT_ID_RE,
  CORE_FEATURES,
  DIGEST_RE,
  FEATURE_ID_RE,
  FEATURE_MODULE_ID,
  MAX_REGISTRY_BYTES,
  MODULE_ID_RE,
  REGISTRY_VERSION,
  featureRecordSchema,
  moduleRecordSchema,
  registryBodySchema,
  registrySchema,
  type CatalogFeature,
  type CatalogInput,
  type CatalogModule,
  type DefaultState,
  type FeatureRecord,
  type GetDependenciesOutput,
  type ListFeaturesOutput,
  type ModuleRecord,
  type ModuleScope,
  type Registry,
  type RegistryBody,
  type Surface,
} from './schema.ts';
export {
  buildRegistry,
  buildRegistryBody,
  contentDigest,
  deepFreeze,
  diffRegistry,
  featureErrors,
  finalizeRegistry,
  findCycle,
  getDependencies,
  getOrder,
  hexToBase64url,
  indexRegistry,
  isCoreFeature,
  isKnownKey,
  listFeatures,
  registryManifestEntry,
  surfaceOf,
  textDigest,
  topologicalOrder,
  verifyHash,
  type RegistryDiff,
  type RegistryIndex,
} from './rules.ts';
export {
  CATALOG_PATH,
  REGISTRY_OUTPUT_PATH,
  checkStale,
  generateFromCatalog,
  generateRegistry,
  loadCatalog,
  parseFeatureHeaders,
  renderRegistryModule,
  runGeneration,
  specPathOf,
  summaryLine,
  type GenerationOutput,
  type GenerationSummary,
  type PipelineStep,
  type RegistryIo,
  type RegistryWriter,
  type RunOptions,
} from './generate.ts';
export { FEATURE_QUERY_RATE, READ_REGISTRY, featureQueries, getDependenciesQuery, getOrderQuery, listFeaturesQuery, registryFrom, verifyHashQuery } from './commands.ts';
export { FEATURE_PORTS } from './ports.ts';
export { registry } from './registry.ts';

export const moduleDef = {
  id: FEATURE_MODULE_ID,
  commands: [],
  queries: featureQueries,
  consumers: [],
  events: [],
  errors: featureErrors,
} as const;
