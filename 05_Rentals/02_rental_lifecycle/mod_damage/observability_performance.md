# PS-041-08 — Observability and performance: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-08.R01** The PWA sends no telemetry (OBS-7); counters and the diagnostics log stay in the vault and are exportable by the user.
- **PS-041-08.R02** Comparison of two 30-item reports and claim signing meet p95 ≤ 150 ms on a mid-range phone, excluding image handling.
- **PS-041-08.R03** Sweep over 2 000 claims completes in ≤ 100 ms in slices of at most 50 ms.

## Specification

**Metrics**
- classrup_rentals_damage_claims_total{state} (local counter)
- classrup_rentals_damage_escalations_total{reason=contest|silence|counter_rejected} (local counter)
- classrup_rentals_statements_quarantined_total{code} (local counter)

**Logs**
- info damage.resolved {claimId, outcome, correlationId} in the local diagnostics log - no amounts, no descriptions.

**Budgets**
- compare_reports and claim p95 ≤ 150 ms; get p95 ≤ 50 ms; sweep over 2 000 claims ≤ 100 ms.
- Case request round trip inside one vault ≤ 500 ms p95.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T13 | load | PS-041-08.R01, PS-041-08.R02, PS-041-08.R03 | two 30-item reports and 2 000 claims on throttled mobile profile | p95 ≤ 150 ms, sweep ≤ 100 ms, no telemetry request |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
