# PS-066-08 — Observability and performance: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-08.R01** Relay publish, retire and list are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-066-08.R02** Public list queries meet p95 ≤ 150 ms for 100 items and the vault suggest meets p95 ≤ 50 ms with 5 000 cached spots.
- **PS-066-08.R03** Cache age and refresh failures are visible in local diagnostics.

## Specification

**Metrics**
- classrup_comms_safe_spots_total{status=active|retired} (relay)
- classrup_comms_safe_spot_publish_total{outcome=ok|untrusted|invalid} (relay)
- classrup_comms_safe_spot_cache_age_ms (gauge, local diagnostics)

**Logs**
- relay info safe_spot.published {spotId, version, correlationId} — no user data exists in this module.

**Budgets**
- list_for_cell p95 ≤ 150 ms for 100 items; suggest p95 ≤ 50 ms with 5 000 cached spots on a mid-range phone.
- Bundled starter set ≤ 200 KiB per region.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T10 | load | PS-066-08.R01, PS-066-08.R02, PS-066-08.R03 | 5 000 cached spots suggest 1 000 times; list 100 items at 50 req/s | budgets met |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
