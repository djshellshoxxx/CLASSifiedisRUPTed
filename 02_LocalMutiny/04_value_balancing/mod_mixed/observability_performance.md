# PS-026-08 — Observability and performance: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-08.R01** Local diagnostics record leg and claim outcomes without amounts or DIDs and send nothing off the device (OBS-7).
- **PS-026-08.R02** The planner for 8 participants completes within 5 ms.
- **PS-026-08.R03** Claim command including F09 call completes within 200 ms at p95 locally.

## Specification

**Metrics**
- classrup_mutiny_compensation_total{outcome=proposed|due|claimed|settled|disputed|expired|waived|withdrawn} (local diagnostics)

**Logs**
- info compensation.claimed {compensationLegId, method, correlationId} — no amounts or DIDs.

**Budgets**
- suggest_plan p95 ≤ 5 ms for 8 participants; claim p95 ≤ 200 ms; list_for_subject p95 ≤ 20 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T13 | load | PS-026-08.R02, PS-026-08.R03 | planner 8 participants and claim on emulated Moto G | within budgets |
| TEST-PS-026-09.T14 | unit | PS-026-08.R01, PS-026-09.R01, PS-026-09.R03 | diagnostics and traceability tool | no amounts or DIDs in diagnostics; every PS-026 requirement maps to a passing test |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
