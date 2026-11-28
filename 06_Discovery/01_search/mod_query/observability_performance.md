# PS-046-08 — Observability and performance: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-08.R01** Query latency and outcomes are measured on relays per CTR-OBS-001 and in the vault diagnostics log only.
- **PS-046-08.R02** Local query p95 is at most 120 ms over 5 000 documents on a Moto G-class device and relay query p95 is at most 200 ms over 100 000 documents.
- **PS-046-08.R03** Saved search evaluation processes 500 queued documents against 25 searches within 2 seconds.

## Specification

**Metrics**
- classrup_discovery_query_duration_ms{source=local|relay} (histogram)
- classrup_discovery_query_total{outcome=ok|invalid|rate_limited|error}
- classrup_discovery_saved_search_evaluations_total{outcome=matched|no_match|pre_watermark}
- local counter relay_items_unverified_total (vault diagnostics)

**Logs**
- info query.served {source, resultCount, durationMs, correlationId} - never the query text.

**Budgets**
- Relay query p95 <= 200 ms at 100 000 documents and 50 req/s; local query p95 <= 120 ms at 5 000 documents; verification of 20 relay items <= 40 ms on the vault device.
- Relay timeout 4 s from the client; saved-search batch of 500 documents x 25 searches <= 2 s including confirmation runs.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T13 | load | PS-046-08.R01, PS-046-08.R02, PS-046-08.R03 | 50 req/s on relay with 100 000 documents; vault with 5 000 documents; 500 queued matches | relay p95 <= 200 ms, vault p95 <= 120 ms, evaluation <= 2 s |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
