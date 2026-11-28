# PS-027-08 — Observability and performance: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-08.R01** Local diagnostics record outcomes without amounts or DIDs and send nothing off the device (OBS-7).
- **PS-027-08.R02** declare completes within 80 ms at p95 including signing; list_for_items for 200 items within 50 ms.
- **PS-027-08.R03** Relay deployments that index projections expose counts by plausibility class under CTR-OBS-001.

## Specification

**Metrics**
- classrup_mutiny_valuations_total{outcome=declared|flagged_auto|flagged_peer|acknowledged|quarantined} (local diagnostics)
- classrup_mutiny_valuation_projection_total{plausibility} (relay)

**Logs**
- info valuation.declared {valuationId, plausibility, seq, correlationId} — no amounts or DIDs.

**Budgets**
- declare p95 ≤ 80 ms; ingest p95 ≤ 50 ms; list_for_items(200) p95 ≤ 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T12 | load | PS-027-08.R02, PS-027-08.R03 | declare and list_for_items(200) on emulated Moto G | within budgets |
| TEST-PS-027-09.T13 | unit | PS-027-08.R01, PS-027-09.R01 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-027 requirement maps to a passing test |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
