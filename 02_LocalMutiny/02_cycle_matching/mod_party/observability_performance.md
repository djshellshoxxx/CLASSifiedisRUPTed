# PS-019-08 — Observability and performance: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-08.R01** Local diagnostics record update and ingest outcomes without DIDs or exclusions and send nothing off the device (OBS-7).
- **PS-019-08.R02** Relay deployments export projection ingest counts under CTR-OBS-001.
- **PS-019-08.R03** Eligibility checks for 8 participants complete within 5 ms on a mid-range phone.

## Specification

**Metrics**
- classrup_mutiny_profile_ingest_total{outcome=accepted|quarantined|stale} (relay)
- classrup_mutiny_profile_optin_total{outcome=in|out} (relay, from projections it indexes)

**Logs**
- info matching_profile.updated {profileId, seq, optedIn, correlationId} — no exclusions, no DIDs of others.

**Budgets**
- update p95 ≤ 100 ms local commit; projection signing ≤ 20 ms.
- list_known for 200 actors p95 ≤ 50 ms from IndexedDB.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T12 | load | PS-019-08.R03 | check_eligible for 8 actors and list_known for 200 | within budgets on emulated Moto G |
| TEST-PS-019-09.T16 | unit | PS-019-08.R01 | local diagnostics after update and ingest | outcomes recorded without DIDs or exclusions; nothing transmitted |
| TEST-PS-019-09.T17 | contract | PS-019-08.R02 | relay deployment ingests valid, stale and invalid projections | classrup_mutiny_profile_ingest_total counts per outcome exported per CTR-OBS-001 without DIDs |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
