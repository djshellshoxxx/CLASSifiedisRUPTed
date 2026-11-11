# PS-023-08 — Observability and performance: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-08.R01** Reservation outcomes and expiry sweeps are counted in local diagnostics without identifiers (OBS-7).
- **PS-023-08.R02** Reserve of 5 items completes within 100 ms at p95 on a mid-range phone.
- **PS-023-08.R03** Expiry sweep over 200 locks completes within 50 ms.

## Specification

**Metrics**
- classrup_mutiny_locks_total{outcome=reserved|released|converted|expired|conflicted|rejected} (local diagnostics)
- classrup_mutiny_lock_conflicts_total (local diagnostics)

**Logs**
- info lock.reserved {lockId, itemCount, correlationId} — no item ids, no DIDs.
- warn lock.conflict_detected {correlationId}

**Budgets**
- reserve p95 ≤ 100 ms for 5 items; ingest p95 ≤ 60 ms including signature verification; expiry sweep ≤ 50 ms for 200 locks.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T14 | load | PS-023-08.R02, PS-023-08.R03 | reserve 5 items; sweep 200 locks on emulated Moto G | within budgets |
| TEST-PS-023-09.T15 | unit | PS-023-08.R01, PS-023-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-023 requirement maps to a passing test |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
