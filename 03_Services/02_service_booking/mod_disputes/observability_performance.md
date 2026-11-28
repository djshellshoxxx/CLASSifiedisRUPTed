# PS-030-08 — Observability and performance: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-08.R01** The PWA sends no telemetry (OBS-7); counters and diagnostics stay in the vault.
- **PS-030-08.R02** Open and preview_evidence meet p95 ≤ 200 ms with 25 evidence items on a mid-range phone.
- **PS-030-08.R03** Evidence assembly never blocks the UI thread longer than 50 ms per slice.

## Specification

**Metrics**
- classrup_services_disputes_total{outcome=opened|linked|resolved|withdrawn|merged|link_failed} (local counter)
- classrup_services_dispute_link_latency_ms (local histogram from open to linked)
- classrup_services_dispute_notices_quarantined_total{code} (local counter)

**Logs**
- info dispute.opened {linkId, scope, correlationId} in the local diagnostics log - no statement text and no evidence names.

**Budgets**
- open p95 ≤ 200 ms; preview_evidence p95 ≤ 150 ms; get p95 ≤ 50 ms.
- Link to case round trip inside one vault ≤ 500 ms p95.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T12 | load | PS-030-08.R01, PS-030-08.R02, PS-030-08.R03 | 25 evidence items on throttled mobile profile | open p95 ≤ 200 ms, no telemetry request, UI slices ≤ 50 ms |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
