# PS-004-08 — Observability and performance: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-08.R01** The PWA sends no telemetry (OBS-7); publication counters and sync states are local diagnostics, exportable by the user.
- **PS-004-08.R02** Local publish latency excludes network transport and is budgeted on Moto G-class hardware.
- **PS-004-08.R03** Relay-side behaviour of accepting index writes is measured by the relay under OBS-1 to OBS-4.

## Specification

**Metrics**
- classrup_bazaar_publications_total{outcome=active|blocked|held|policy_attention|unpublished|ended} (local)
- classrup_bazaar_publication_delivery_total{state} (local)
- classrup_bazaar_publication_policy_duration_ms (local histogram)
- classrup_bazaar_relay_notice_quarantined_total{reason} (local)
- classrup_bazaar_relay_index_writes_total{outcome} (relay, OBS-2 labels only)

**Logs**
- info publication.active {publicationId, listingId, correlationId} in local diagnostics; no titles or text.

**Budgets**
- publish p95 <= 150 ms locally including policy evaluation (2 000 rules, 8 000 code points), risk assessment and Ed25519 signing, excluding network.
- Relay index write p95 <= 300 ms at 50 req/s (OBS-4).
- Policy re-evaluation sweep: 200 publications per batch in <= 2 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T16 | load | PS-004-08.R01, PS-004-08.R02, PS-004-08.R03 | 200 publications re-evaluated on Moto G profile; relay at 50 req/s | publish p95 <= 150 ms, batch <= 2 s, relay p95 <= 300 ms, no telemetry requests |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
