# PS-039-08 — Observability and performance: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-08.R01** The PWA sends no telemetry (OBS-7); counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-039-08.R02** Overlap check and confirm meet p95 ≤ 100 ms with 5 000 reservations and quantity 20 on a mid-range phone.
- **PS-039-08.R03** Busy summary generation for 365 days meets p95 ≤ 150 ms.

## Specification

**Metrics**
- classrup_rentals_reservations_total{outcome=requested|confirmed|cancelled|expired|frozen} (local counter)
- classrup_rentals_interval_conflicts_total (local counter)
- classrup_rentals_statements_quarantined_total{code} (local counter)

**Logs**
- info reservation.confirmed {reservationId, correlationId} in the local diagnostics log - no identities, no address, no amounts.

**Budgets**
- overlap check plus confirm p95 ≤ 100 ms with 5 000 reservations; list queries p95 ≤ 80 ms for 50 items; busy summary p95 ≤ 150 ms.
- Sweep over 5 000 reservations ≤ 150 ms in slices of at most 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T13 | load | PS-039-08.R01, PS-039-08.R02, PS-039-08.R03 | 5 000 reservations, quantity 20, throttled mobile profile | check p95 ≤ 100 ms, busy summary p95 ≤ 150 ms, no telemetry request |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
