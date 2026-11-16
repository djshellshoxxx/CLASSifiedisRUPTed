# PS-007-08 — Observability and performance: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-007-08.R02** Define and list_open meet local latency budgets on Moto G-class hardware.
- **PS-007-08.R03** Consumer lag for listing events is visible in local diagnostics.

## Specification

**Metrics**
- classrup_bazaar_wants_total{outcome=declared|fulfilled|withdrawn} (local)
- classrup_bazaar_want_consumer_lag_ms (local gauge)

**Logs**
- info want.declared {wantId, listingId, correlationId} in local diagnostics; no keywords or budgets.

**Budgets**
- define p95 <= 60 ms; list_open of 100 wants p95 <= 100 ms on Moto G-class hardware.
- Event handling p95 <= 30 ms per event.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T12 | load | PS-007-08.R01, PS-007-08.R02, PS-007-08.R03 | 100 wants on Moto G profile | define p95 <= 60 ms, list p95 <= 100 ms, event handling p95 <= 30 ms, no network |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
