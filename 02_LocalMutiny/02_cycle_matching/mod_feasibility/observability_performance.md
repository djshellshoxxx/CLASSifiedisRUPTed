# PS-016-08 — Observability and performance: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-08.R01** Check duration and outcome counts are recorded in local diagnostics without participant identifiers and not sent anywhere (OBS-7).
- **PS-016-08.R02** A full 8-participant evaluation completes within 20 ms at p95 on a mid-range phone with warm caches.
- **PS-016-08.R03** Failure codes are countable locally so the UI can show the most common reasons to the user.

## Specification

**Metrics**
- classrup_mutiny_feasibility_checks_total{outcome=feasible|conditions|infeasible} (local diagnostics; relay exports only if it runs relay-side checks)

**Logs**
- debug feasibility.completed {reportId, overall, failedCodes, correlationId} — no DIDs.

**Budgets**
- evaluation p95 ≤ 20 ms for ≤ 8 participants; stored report ≤ 16 KiB.
- Port reads for inventory and projections ≤ 50 ms total from IndexedDB.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T13 | load | PS-016-08.R02, PS-016-08.R03 | 8-participant evaluation on emulated Moto G | p95 ≤ 20 ms |
| TEST-PS-016-09.T14 | unit | PS-016-08.R01, PS-016-08.R02 | metric counters after runs | counters present locally, nothing transmitted |

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
