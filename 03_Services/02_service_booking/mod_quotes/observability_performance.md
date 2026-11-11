# PS-032-08 — Observability and performance: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-08.R01** The PWA sends no telemetry (OBS-7); local counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-032-08.R02** Vault commands meet p95 ≤ 150 ms on a mid-range phone with 2 000 bookings stored, excluding network delivery.
- **PS-032-08.R03** Statement verification meets p95 ≤ 30 ms per envelope.

## Specification

**Metrics**
- classrup_services_quotes_total{outcome=requested|issued|superseded|accepted|declined|expired} (local counter)
- classrup_services_statements_quarantined_total{code} (local counter)
- classrup_services_bookings_conflicted_total{kind} (local counter)
- classrup_services_booking_confirm_latency_ms (local histogram from acceptance receipt to confirmation)

**Logs**
- info booking.confirmed {bookingId, correlationId} in the local diagnostics log - no descriptions, attachment names, amounts or addresses.

**Budgets**
- vault command p95 ≤ 150 ms; list queries p95 ≤ 80 ms for 50 items; statement verification p95 ≤ 30 ms.
- Sweep over 2 000 records ≤ 150 ms, split into slices of at most 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T12 | load | PS-032-08.R01, PS-032-08.R02, PS-032-08.R03 | 2 000 bookings, 100 mixed commands on throttled mobile profile | command p95 ≤ 150 ms, verify p95 ≤ 30 ms, no telemetry request |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
