# PS-025-08 — Observability and performance: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-08.R01** Local diagnostics record compute and verify outcomes without amounts or DIDs and send nothing off the device (OBS-7).
- **PS-025-08.R02** compute for 16 items with 4 quotes completes within 60 ms at p95 excluding network quote retrieval.
- **PS-025-08.R03** Verify of a peer record completes within 20 ms.

## Specification

**Metrics**
- classrup_mutiny_normalizations_total{outcome=computed|verified|mismatch|expired|unavailable} (local diagnostics)

**Logs**
- info normalization.computed {normalizationId, currencies, quotes, correlationId} — no amounts or DIDs.
- warn normalization.mismatch {revisionId, correlationId}

**Budgets**
- compute p95 ≤ 60 ms without network; verify p95 ≤ 20 ms; quote retrieval timeout 2 s per pair.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T13 | load | PS-025-08.R02 | 16 items 4 quotes on emulated Moto G | p95 ≤ 60 ms |
| TEST-PS-025-09.T14 | unit | PS-025-08.R01, PS-025-08.R03, PS-025-09.R01 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-025 requirement maps to a passing test |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
