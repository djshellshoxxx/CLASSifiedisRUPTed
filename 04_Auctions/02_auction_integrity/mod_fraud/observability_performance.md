# PS-037-08 — Observability and performance: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-08.R01** The host exports metrics and logs per OBS-1 to OBS-6 without evidence content or keys; the PWA sends no telemetry (OBS-7).
- **PS-037-08.R02** Review open and decision commands meet p95 ≤ 300 ms excluding the evidence snapshot, which completes within 5 s for ledgers of 5 000 entries.
- **PS-037-08.R03** The queue query meets p95 ≤ 150 ms for 50 items.

## Specification

**Metrics**
- classrup_auctions_reviews_total{status,trigger}
- classrup_auctions_review_age_seconds (gauge: oldest unassigned review)
- classrup_auctions_voids_total{reason} and classrup_auctions_void_rescissions_total

**Logs**
- info review.closed {reviewId, auctionId, decision, correlationId} - no findings text and no keys.

**Budgets**
- decision commands p95 ≤ 300 ms; evidence snapshot ≤ 5 s for 5 000 ledger entries; queue p95 ≤ 150 ms.
- Void statement fan-out to 500 participants queued within 2 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T12 | load | PS-037-08.R02, PS-037-08.R03 | 5 000 entry ledger snapshot and fan-out to 500 participants | snapshot ≤ 5 s, decision p95 ≤ 300 ms, fan-out ≤ 2 s |
| TEST-PS-037-09.T23 | e2e | PS-037-08.R01 | network capture of a participant PWA receiving the void notice | zero telemetry or analytics requests |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
