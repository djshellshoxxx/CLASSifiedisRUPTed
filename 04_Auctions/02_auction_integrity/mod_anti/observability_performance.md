# PS-036-08 — Observability and performance: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-08.R01** The host exports metrics and logs per OBS-1 to OBS-6 without key material in labels or messages.
- **PS-036-08.R02** The synchronous check meets p95 ≤ 40 ms and p99 ≤ 100 ms with 10 000 linkage cache entries.
- **PS-036-08.R03** Scoring completes within 5 s of the trigger bid at p95 under 50 bids per second.

## Specification

**Metrics**
- classrup_auctions_shill_checks_total{verdict=allow|deny}
- classrup_auctions_shill_flags_total{reason}
- classrup_auctions_shill_score_lag_ms (histogram)
- classrup_auctions_shill_linkage_stale_total

**Logs**
- info shill.denied {auctionId, checkId, correlationId} - no key and no reason code.

**Budgets**
- check p95 ≤ 40 ms, p99 ≤ 100 ms; score job p95 ≤ 5 s end to end.
- Linkage cache refresh for one identity document ≤ 200 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T11 | load | PS-036-08.R01, PS-036-08.R02, PS-036-08.R03 | 10 000 cache entries, 50 bids per second for 5 minutes | check p95 ≤ 40 ms, score lag p95 ≤ 5 s, metrics exported without key labels |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
