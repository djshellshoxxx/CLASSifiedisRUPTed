# TODO: F15.S03.M01 observability

**Status:** IMPLEMENTED; relay wiring pending.

## Implemented
- [x] `JsonLogger` with kernel redaction, level threshold, injectable sink (`packages/platform/src/ops/logger.ts`; `packages/platform/test/observability.test.ts`)
- [x] `MetricsRegistry`: counters, gauges, fixed-bucket histograms, Prometheus text, label escaping, cardinality cap (`packages/platform/src/ops/metrics.ts`)
- [x] `HealthRegistry` liveness/readiness with per-check timeout on the injected clock (`packages/platform/src/ops/health.ts`)
- [x] SLO error budget, burn rate and `SloTracker` (`packages/platform/src/ops/slo.ts`)
- [x] Ops `platform.health.check` (public, status only), `platform.health.report`, `platform.metrics.export` (`packages/platform/src/ops/observability-ops.ts`)

## Remaining
- [ ] Relay: stdout sink, `/metrics` endpoint, concrete health checks (storage, scheduler)
- [ ] Distributed tracing is not implemented

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
