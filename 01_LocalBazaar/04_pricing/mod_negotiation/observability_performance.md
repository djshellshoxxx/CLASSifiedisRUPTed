# PS-010-08 — Observability and performance: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-010-08.R02** Local command latency and statement verification meet budgets on Moto G-class hardware.
- **PS-010-08.R03** Sweep lag and frozen-chain counts are visible in diagnostics.

## Specification

**Metrics**
- classrup_bazaar_negotiations_total{outcome} (local)
- classrup_bazaar_negotiation_quarantined_total{reason} (local)
- classrup_bazaar_negotiation_frozen_total (local)
- classrup_bazaar_negotiation_expiry_lag_ms (local gauge)

**Logs**
- info negotiation.closed {negotiationId, outcome, correlationId} in local diagnostics; no amounts or notes.

**Budgets**
- counter and receive p95 <= 100 ms including Ed25519 verify or sign on Moto G-class hardware.
- accept in the seller vault (hold + deal handoff + consent + sign) p95 <= 200 ms.
- list_mine of 50 chains p95 <= 100 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T16 | load | PS-010-08.R01, PS-010-08.R02, PS-010-08.R03 | 50 chains, 500 statements on Moto G profile | counter and receive p95 <= 100 ms, accept p95 <= 200 ms, no telemetry |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
