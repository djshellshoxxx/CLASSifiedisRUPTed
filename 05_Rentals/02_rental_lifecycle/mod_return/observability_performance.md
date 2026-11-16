# PS-043-08 — Observability and performance: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-08.R01** The PWA sends no telemetry (OBS-7); counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-043-08.R02** Late-fee computation and report signing meet p95 ≤ 120 ms on a mid-range phone, excluding image re-encoding.
- **PS-043-08.R03** The overdue sweep over 5 000 returns completes in ≤ 100 ms in slices of at most 50 ms.

## Specification

**Metrics**
- classrup_rentals_returns_total{state} (local counter)
- classrup_rentals_overdue_detected_total (local counter)
- classrup_rentals_late_fee_minor_sum (local gauge, never exported)

**Logs**
- info return.attested {returnId, correlationId} in the local diagnostics log - no amounts, no notes.

**Budgets**
- report/attest p95 ≤ 120 ms; get p95 ≤ 50 ms; overdue sweep over 5 000 returns ≤ 100 ms.
- Closure re-evaluation per event p95 ≤ 30 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T12 | load | PS-043-08.R01, PS-043-08.R02, PS-043-08.R03 | 5 000 returns, throttled mobile profile | sign p95 ≤ 120 ms, sweep ≤ 100 ms, no telemetry request |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
