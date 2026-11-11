# PS-002-08 — Observability and performance: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-08.R01** The PWA sends no telemetry (OBS-7); counters are kept in the local diagnostics store and are exportable by the user.
- **PS-002-08.R02** Vault command and query latency budgets are measured on a Moto G-class device profile.
- **PS-002-08.R03** Sweep duration is observable locally.

## Specification

**Metrics**
- classrup_bazaar_listing_commands_total{outcome} (local diagnostics counter)
- classrup_bazaar_draft_purge_total (local)
- classrup_bazaar_listing_command_duration_ms (local histogram)

**Logs**
- info listing.created {listingId, correlationId} in the local diagnostics log; no titles, descriptions or regions.

**Budgets**
- create/apply_edit p95 <= 50 ms and list_mine p95 <= 100 ms for 2 000 listings on Moto G-class hardware.
- Draft purge sweep over 2 000 listings <= 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T11 | load | PS-002-08.R02, PS-002-08.R03 | 2 000 listings on Moto G profile | create p95 <= 50 ms, list p95 <= 100 ms, purge sweep <= 500 ms |
| TEST-PS-002-09.T12 | unit | PS-002-08.R01 | run commands with diagnostics on | counters increment locally and no network request is made |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
