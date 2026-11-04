# PS-013-08 — Observability and performance: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-08.R01** Define and void outcomes are counted in local diagnostics without identifiers (OBS-7).
- **PS-013-08.R02** define completes within 40 ms p95 including IndexedDB reads for 5 items.
- **PS-013-08.R03** Garbage collection of 200 legs completes within 100 ms.

## Specification

**Metrics**
- classrup_mutiny_legs_total{outcome=defined|referenced|voided|rejected} (local diagnostics)

**Logs**
- debug leg.defined {legId, itemCount, basis, correlationId} — no DIDs or values.

**Budgets**
- define p95 ≤ 40 ms; list_for_subject p95 ≤ 20 ms; garbage collection ≤ 100 ms for 200 legs.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T13 | load | PS-013-08.R02, PS-013-08.R03 | define 5-item legs and GC of 200 legs | within budgets on emulated Moto G |
| TEST-PS-013-09.T14 | unit | PS-013-08.R01, PS-013-09.R01 | traceability tool run and diagnostics | every PS-013 requirement maps to a passing test; no identifiers in diagnostics |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
