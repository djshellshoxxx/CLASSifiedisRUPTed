# PS-009-08 — Observability and performance: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-009-08.R02** Variant commands including the inventory call meet local latency budgets on Moto G-class hardware.
- **PS-009-08.R03** Variant list rendering with 50 variants stays interactive.

## Specification

**Metrics**
- classrup_bazaar_variant_commands_total{outcome} (local)
- classrup_bazaar_variant_price_changes_total (local)

**Logs**
- info variant.changed {listingId, variantId, change, correlationId} in local diagnostics; no labels or prices.

**Budgets**
- add/update p95 <= 80 ms including inventory call; list of 50 variants p95 <= 100 ms on Moto G-class hardware.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T13 | load | PS-009-08.R01, PS-009-08.R02, PS-009-08.R03 | 50 variants on Moto G profile | add p95 <= 80 ms, list p95 <= 100 ms, no telemetry |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S01.M03, F01.S02.M01, F01.S04.M01, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
