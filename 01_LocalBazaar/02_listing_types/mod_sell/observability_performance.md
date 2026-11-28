# PS-006-08 — Observability and performance: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-006-08.R02** Define meets local latency budgets on Moto G-class hardware.
- **PS-006-08.R03** Validation failures are counted by code for local debugging.

## Specification

**Metrics**
- classrup_bazaar_sell_terms_commands_total{outcome, code} (local)
- classrup_bazaar_sell_price_changes_total (local)

**Logs**
- info sell_terms.set {listingId, revision, priceChanged, correlationId} in local diagnostics; no amounts.

**Budgets**
- define p95 <= 60 ms; get p95 <= 30 ms on Moto G-class hardware.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T12 | load | PS-006-08.R01, PS-006-08.R02, PS-006-08.R03 | 1 000 define calls on Moto G profile | p95 <= 60 ms, counters present, no network |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
