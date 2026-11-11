// F15.S04.M01 read-only registry queries (no commands, statements or events). They run in the vault and on a
// relay with identical results for the same release; the registry is compiled in and cannot be changed at runtime.
import { defineQuery, ok, type MetricsRegistry, type Ports, type QueryContext } from '@classrup/kernel';
import { getDependencies, getOrder, listFeatures, verifyHash } from './rules.ts';
import {
  FEATURE_MODULE_ID,
  getDependenciesInput,
  getDependenciesOutput,
  getOrderInput,
  getOrderOutput,
  listFeaturesInput,
  listFeaturesOutput,
  verifyHashInput,
  verifyHashOutput,
  type Registry,
} from './schema.ts';
import { FEATURE_PORTS } from './ports.ts';
import { registry as compiledRegistry } from './registry.ts';

export const READ_REGISTRY = 'platform.feature.read_registry';
/** Relay hosting policy for these queries: 100 requests per minute per client (results are static). */
export const FEATURE_QUERY_RATE = { limit: 100, windowMs: 60_000 } as const;

/** The compiled-in registry, or a fixture registry injected by tests through the ports record. */
export function registryFrom(ports: Ports): Registry {
  const injected = ports[FEATURE_PORTS.registry] as Registry | undefined;
  return injected ?? compiledRegistry;
}

function timed<T>(ctx: QueryContext, run: () => T): T {
  const metrics = ctx.ports[FEATURE_PORTS.metrics] as MetricsRegistry | undefined;
  if (!metrics) return run();
  const started = globalThis.performance.now();
  try {
    return run();
  } finally {
    const histogram = metrics.histogram({ name: 'classrup_platform_feature_query_duration_ms', help: 'Feature registry query duration in milliseconds.', labels: ['module'] });
    histogram.observe({ module: FEATURE_MODULE_ID }, globalThis.performance.now() - started);
  }
}

const common = { module: FEATURE_MODULE_ID, capability: READ_REGISTRY, surface: 'both', auth: 'public' } as const;

export const listFeaturesQuery = defineQuery({
  ...common,
  name: 'platform.feature.list_features',
  input: listFeaturesInput,
  output: listFeaturesOutput,
  handler: (ctx, input) => timed(ctx, () => listFeatures(registryFrom(ctx.ports), input)),
});

export const getDependenciesQuery = defineQuery({
  ...common,
  name: 'platform.feature.get_dependencies',
  input: getDependenciesInput,
  output: getDependenciesOutput,
  handler: (ctx, input) => timed(ctx, () => getDependencies(registryFrom(ctx.ports), input)),
});

export const getOrderQuery = defineQuery({
  ...common,
  name: 'platform.feature.get_order',
  input: getOrderInput,
  output: getOrderOutput,
  handler: (ctx) => timed(ctx, () => ok(getOrder(registryFrom(ctx.ports)))),
});

export const verifyHashQuery = defineQuery({
  ...common,
  name: 'platform.feature.verify_hash',
  input: verifyHashInput,
  output: verifyHashOutput,
  handler: (ctx, input) => timed(ctx, () => ok(verifyHash(registryFrom(ctx.ports), input.hash))),
});

export const featureQueries = [listFeaturesQuery, getDependenciesQuery, getOrderQuery, verifyHashQuery] as const;
