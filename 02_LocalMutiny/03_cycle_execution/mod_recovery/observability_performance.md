# PS-024-08 — Observability and performance: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-08.R01** Local diagnostics record attestation and recovery outcomes without DIDs, notes or photos and send nothing (OBS-7).
- **PS-024-08.R02** attest including signing and completion check completes within 150 ms at p95 on a mid-range phone.
- **PS-024-08.R03** Completion evaluation for 8 legs completes within 10 ms.

## Specification

**Metrics**
- classrup_mutiny_attestations_total{kind,outcome=valid|quarantined|duplicate} (local diagnostics)
- classrup_mutiny_cycles_completed_total and classrup_mutiny_recovery_cases_total{trigger,outcome} (local diagnostics)

**Logs**
- info attestation.recorded {kind, cycleId, correlationId} — no DIDs, notes or attachment ids.
- info recovery.opened {trigger, correlationId}

**Budgets**
- attest p95 ≤ 150 ms; ingest p95 ≤ 80 ms including signature verification; completion evaluation ≤ 10 ms for 8 legs.
- Evidence photos re-encoded to ≤ 5 MiB each before attaching.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T17 | load | PS-024-08.R02, PS-024-08.R03 | attest and completion for 8 legs on emulated Moto G | within budgets |
| TEST-PS-024-09.T18 | unit | PS-024-08.R01, PS-024-09.R01 | diagnostics and traceability tool | no identifiers or notes in diagnostics; every PS-024 requirement maps to a passing test |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
