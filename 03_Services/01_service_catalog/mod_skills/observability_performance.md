# PS-029-08 — Observability and performance: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-08.R01** The PWA sends no telemetry (OBS-7); counters and the error log stay in the vault and can be exported by the user.
- **PS-029-08.R02** Create, revise and publish meet a local write budget of p95 ≤ 100 ms on a mid-range phone with 1 000 offerings in the vault.
- **PS-029-08.R03** Local reads meet p95 ≤ 50 ms.

## Specification

**Metrics**
- classrup_services_offerings_total{outcome=created|published|withdrawn}
- classrup_services_offering_validation_failures_total{code}

**Logs**
- info offering.published {offeringId, correlationId} in the local diagnostics log only — no credential text.

**Budgets**
- vault write commands p95 ≤ 100 ms; services.offering.get p95 ≤ 50 ms; list_mine p95 ≤ 80 ms for 50 items.
- Draft sweep over 5 000 drafts completes in ≤ 2 s without blocking the UI thread longer than 50 ms per slice.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T11 | load | PS-029-08.R01, PS-029-08.R02, PS-029-08.R03 | 1 000 offerings in vault, 100 mixed writes and reads on a throttled mobile profile | write p95 ≤ 100 ms, read p95 ≤ 50 ms, no network request made |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
