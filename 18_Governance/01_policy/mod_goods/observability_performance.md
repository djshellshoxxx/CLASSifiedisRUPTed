# PS-144-08 — Observability and performance: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-08.R01** No telemetry leaves the device (OBS-7); pack outcomes are local diagnostics.
- **PS-144-08.R02** Tree queries and pack application meet local budgets on Moto G-class hardware.
- **PS-144-08.R03** The relay serving packs follows OBS-1 to OBS-4.

## Specification

**Metrics**
- classrup_governance_category_pack_applied_total{outcome} (local)
- classrup_governance_category_query_duration_ms (local histogram)
- classrup_governance_pack_downloads_total (relay)

**Logs**
- info category.pack_applied {packVersion, publisherFingerprint, correlationId} in local diagnostics.

**Budgets**
- tree query for 2 000 categories p95 <= 60 ms; get/resolve p95 <= 10 ms on Moto G-class hardware.
- apply_pack of a 2 000-category pack p95 <= 800 ms.
- Relay pack download p95 <= 150 ms at 50 req/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T12 | load | PS-144-08.R01, PS-144-08.R02, PS-144-08.R03 | 2 000-category tree on Moto G profile; relay at 50 req/s | tree p95 <= 60 ms, apply p95 <= 800 ms, relay p95 <= 150 ms, no telemetry |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
