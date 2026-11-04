# PS-123-08 — Observability and performance: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-08.R01** Generation reports counts and duration in CI and fails when budgets are exceeded.
- **PS-123-08.R02** Registry queries meet read budgets on the PWA and on a relay (CTR-OBS-001 OBS-4, OBS-5).
- **PS-123-08.R03** The PWA sends no telemetry; any usage counters stay local (OBS-7).

## Specification

**Metrics**
- CI gauges: registry_features, registry_modules, registry_edges, registry_bytes, generation_ms.
- classrup_platform_feature_query_duration_ms (relay histogram)

**Logs**
- CI log: registry summary line with counts and hash; validation errors list module IDs only.

**Budgets**
- Generation ≤ 2 s for 148 modules; registry JSON ≤ 64 KiB gzip and ≤ 512 KiB raw.
- Query p95 ≤ 5 ms in memory on a Moto G-class device; relay p95 ≤ 150 ms (OBS-4).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T10 | load | PS-123-08.R01, PS-123-08.R03 | generate for 148 modules and 5 000 synthetic modules; run 10 000 queries | generation ≤ 2 s for catalog, size within budgets, query p95 ≤ 5 ms |
| TEST-PS-123-09.T11 | integration | PS-123-08.R02 | relay metrics scrape after queries | duration histogram exported per CTR-OBS-001 |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
