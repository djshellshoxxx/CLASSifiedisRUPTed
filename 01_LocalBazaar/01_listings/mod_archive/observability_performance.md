# PS-001-08 — Observability and performance: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-08.R01** No telemetry leaves the device (OBS-7); sweep results are local diagnostics.
- **PS-001-08.R02** Sweeps stay within battery-friendly time budgets on Moto G-class hardware.
- **PS-001-08.R03** Overdue expiry lag is visible to the user in diagnostics.

## Specification

**Metrics**
- classrup_bazaar_listings_ended_total{outcome=expired|closed|archived|restored|superseded|purged} (local)
- classrup_bazaar_expiry_deferrals_total{outcome=renewed|deferred} (local)
- classrup_bazaar_expiry_lag_ms (local gauge: now - oldest overdue expiresAt)
- classrup_bazaar_sweep_duration_ms{sweep} (local histogram)

**Logs**
- info listing.closed {listingId, closeReason, correlationId} in local diagnostics; no text.

**Budgets**
- Expiry sweep of 2 000 listings <= 500 ms; close/archive/restore p95 <= 100 ms.
- Expiry lag <= 5 minutes while the app is open.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T12 | load | PS-001-08.R01, PS-001-08.R02, PS-001-08.R03 | sweep of 2 000 listings on Moto G profile | <= 500 ms, lag gauge returns to 0, no telemetry requests |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
