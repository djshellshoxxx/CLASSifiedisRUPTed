// F15.S04.M01 optional injected ports. The registry is compiled in; tests inject fixture registries, and a
// relay composition root may pass its metrics registry for classrup_platform_feature_query_duration_ms.
export const FEATURE_PORTS = {
  /** Registry override (fixtures only); production uses the compiled-in generated registry. */
  registry: 'platform.feature.registry',
  /** MetricsRegistry of the relay (the vault sends no telemetry; OBS-7). */
  metrics: 'platform.feature.metrics',
} as const;
