# PS-008-08 — Observability and performance: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-008-08.R02** Hold and convert stay within local latency budgets on Moto G-class hardware.
- **PS-008-08.R03** Lease sweep lag and frozen-hold counts are visible in diagnostics.

## Specification

**Metrics**
- classrup_bazaar_inventory_holds_total{outcome=held|released|expired|converted|frozen} (local)
- classrup_bazaar_inventory_hold_conflicts_total (local)
- classrup_bazaar_inventory_sweep_lag_ms (local gauge)

**Logs**
- info inventory.held {holdId, holderType, correlationId} in local diagnostics; no quantities tied to people.

**Budgets**
- hold with 20 lines p95 <= 60 ms; check p95 <= 40 ms; convert p95 <= 40 ms on Moto G-class hardware with 500 active holds.
- Lease sweep over 500 holds <= 100 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T15 | load | PS-008-08.R01, PS-008-08.R02, PS-008-08.R03 | 500 active holds on Moto G profile | hold p95 <= 60 ms, sweep <= 100 ms, no telemetry requests |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
