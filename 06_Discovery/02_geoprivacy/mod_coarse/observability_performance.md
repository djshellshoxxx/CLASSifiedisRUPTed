# PS-047-08 — Observability and performance: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-08.R01** The library emits no telemetry in the PWA (OBS-7) and callers measure its cost within their budgets.
- **PS-047-08.R02** Encode and decode are constant time per character, and radius enumeration is bounded by the 512 cell cap.
- **PS-047-08.R03** Benchmarks guard against regression.

## Specification

**Metrics**
- classrup_discovery_geo_radius_cells (histogram, relay only: cells returned per radius query)

**Logs**
- debug geo.rejected {code} - never coordinates or cells.

**Budgets**
- encode or decode <= 5 microseconds; snap <= 10 microseconds; cellsForRadius(100 km) <= 2 ms p95 on a Moto G-class device; bucketBetween <= 5 microseconds.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T12 | load | PS-047-08.R01, PS-047-08.R02, PS-047-08.R03 | benchmark encode, snap, cellsForRadius(100) 100 000 times | within budgets |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
