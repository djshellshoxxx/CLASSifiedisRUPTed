# PS-040-08 — Observability and performance: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-08.R01** The PWA sends no telemetry (OBS-7); counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-040-08.R02** Vault commands meet p95 ≤ 120 ms and payment event handling p95 ≤ 50 ms on a mid-range phone with 2 000 deposits stored.
- **PS-040-08.R03** Statement verification meets p95 ≤ 30 ms per envelope.

## Specification

**Metrics**
- classrup_rentals_deposits_total{state} (local counter)
- classrup_rentals_deposit_decision_overdue_total (local counter)
- classrup_rentals_statements_quarantined_total{code} (local counter)

**Logs**
- info deposit.funded {depositId, correlationId} in the local diagnostics log - no amounts, no evidence names.

**Budgets**
- vault command p95 ≤ 120 ms; payment event p95 ≤ 50 ms; verification p95 ≤ 30 ms; list p95 ≤ 80 ms for 50 items.
- Sweep over 2 000 deposits ≤ 100 ms in slices of at most 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T13 | load | PS-040-08.R01, PS-040-08.R02, PS-040-08.R03 | 2 000 deposits, throttled mobile profile | command p95 ≤ 120 ms, verify p95 ≤ 30 ms, no telemetry request |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
