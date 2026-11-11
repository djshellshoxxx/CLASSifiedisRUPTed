# PS-028-08 — Observability and performance: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-08.R01** The PWA sends no telemetry (OBS-7); local counters and the diagnostics log stay in the vault.
- **PS-028-08.R02** Slot generation for 31 days meets p95 ≤ 50 ms on a mid-range phone.
- **PS-028-08.R03** Hold and commit commands meet p95 ≤ 100 ms with 5 000 stored holds.

## Specification

**Metrics**
- classrup_services_slot_holds_total{outcome=held|extended|reheld|committed|released|expired} (local counter)
- classrup_services_slot_conflicts_total (local counter)
- classrup_services_slot_reconfirmations_pending (local gauge)

**Logs**
- info slot.held {holdId, calendarId, correlationId} in the local diagnostics log - no client identity.

**Budgets**
- list_slots for 31 days p95 ≤ 50 ms; hold, extend and commit p95 ≤ 100 ms; set_rules p95 ≤ 150 ms.
- Expiry sweep over 5 000 holds ≤ 100 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T12 | load | PS-028-08.R01, PS-028-08.R02, PS-028-08.R03 | 5 000 holds, mobile throttled profile | generation p95 ≤ 50 ms, hold p95 ≤ 100 ms, no network requests |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
