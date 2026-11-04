# PS-021-08 — Observability and performance: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-08.R01** Local diagnostics record transitions, verdict inputs and error codes without DIDs, values or statements; the PWA sends no telemetry (OBS-7).
- **PS-021-08.R02** propose for 8 participants completes locally within 500 ms at p95; consent within 300 ms; ingest of one envelope within 80 ms.
- **PS-021-08.R03** Verdict evaluation for 8 participants completes within 20 ms.

## Specification

**Metrics**
- classrup_mutiny_cycles_total{outcome=proposed|committed|declined|cancelled|frozen|completed|partial} (local diagnostics)
- classrup_mutiny_consent_to_commit_ms (histogram, local diagnostics)
- classrup_mutiny_statements_quarantined_total{code} (local diagnostics)

**Logs**
- info cycle.committed_locally {cycleId, length, correlationId} — no DIDs or values.
- warn cycle.consent_late {cycleId, correlationId}

**Budgets**
- propose p95 ≤ 500 ms for 8 participants; consent p95 ≤ 300 ms; ingest p95 ≤ 80 ms; verdict ≤ 20 ms.
- Envelope size per statement ≤ 96 KiB; per-cycle stored evidence ≤ 1 MiB.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T17 | load | PS-021-08.R02, PS-021-08.R03 | 8-participant propose, consent, ingest on emulated Moto G | within p95 budgets |
| TEST-PS-021-09.T18 | unit | PS-021-08.R01, PS-021-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-021 requirement maps to a passing test |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
