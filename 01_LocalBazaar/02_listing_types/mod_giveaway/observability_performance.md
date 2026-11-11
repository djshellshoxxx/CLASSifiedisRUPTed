# PS-005-08 — Observability and performance: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-08.R01** No telemetry leaves the device (OBS-7); queue sizes and statement outcomes are local diagnostics.
- **PS-005-08.R02** Queue processing for 200 requests meets local budgets on Moto G-class hardware.
- **PS-005-08.R03** Relay mailbox behaviour is measured by the relay under OBS-1 to OBS-4 without reading content.

## Specification

**Metrics**
- classrup_bazaar_giveaway_requests_total{outcome} (local)
- classrup_bazaar_giveaway_quarantined_total{reason} (local)
- classrup_bazaar_giveaway_selection_duration_ms (local histogram)
- classrup_bazaar_mailbox_bytes (relay gauge, OBS-2 labels only)

**Logs**
- info giveaway.selected {listingId, requestId, correlationId} in local diagnostics; no notes or pseudonyms.

**Budgets**
- select p95 <= 120 ms including hold and signing on Moto G-class hardware; receive p95 <= 80 ms per statement.
- Queue list of 200 requests p95 <= 150 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T14 | load | PS-005-08.R01, PS-005-08.R02, PS-005-08.R03 | 200 queued requests on Moto G profile | select p95 <= 120 ms, receive p95 <= 80 ms, list p95 <= 150 ms, no telemetry |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
