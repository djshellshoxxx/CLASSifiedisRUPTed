# PS-033-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-08.R01 | `bids.place` p95 ≤ 200 ms server side; p99 ≤ 500 ms. | MVP |
| PS-033-08.R02 | Lock wait p99 ≤ 50 ms (PS-033-06 R01). | MVP |
| PS-033-08.R03 | Logs: `code`, `request_id`, module, timing, `auc_` ID. No `acc_`, `placed_at` or amounts. | MVP |
| PS-033-08.R04 | Bid-rate dashboards per auction count only; no bidder-level views for operators. | MVP |

## Data / schema
Metric labels allowed: `code`, `action`, `from`, `to`. Forbidden: `acc_`, `bid_`, `auc_` (cardinality and linkage), amounts.

## Commands / queries / events
Spans carry `request_id`, `correlation_id` (`cor_`). Auction ID is attached to spans, not metrics.

## States & transitions
Transition metrics from PS-033-03.

## Validation & errors
`bids_validation_rejections_total{code}`.

## Authorization
Operator dashboards: counts only, no `ope` bidder-level read.

## Failure, idempotency, concurrency, offline
Telemetry best-effort; never blocks placement. Offline queue depth aggregate only.

## Privacy, retention, abuse
Telemetry 30 days (ASSUMPTION). Allowlisted attributes. Bid-rate anomaly alerts forwarded to F12 as counts per auction.

## Observability & budgets
| Metric | Target |
|---|---|
| `bids_place_latency_seconds` p95 | ≤ 0.2 s |
| `bids_lock_wait_seconds` p99 | ≤ 0.05 s |
| `bids_outbox_lag_seconds` p95 | ≤ 2 s |
| Duplicate sequence count | 0 |

## Tests
- TEST-PS-033-08-01 (unit): log formatter drops `acc_`, amounts and timestamps.
- TEST-PS-033-08-02 (load): 500 bids per second across 100 auctions for 10 min meet R01 and R02.
- TEST-PS-033-08-03 (lint): metric labels contain no forbidden label.
- TEST-PS-033-08-04 (alert): duplicate-sequence counter above 0 pages on-call.

## Acceptance criteria
1. Load test meets budgets in staging (future phase gate).
2. Log sample of 10,000 lines contains zero bidder identifiers.
3. Duplicate-sequence alert configured.

## Assumptions & open decisions
- ASSUMPTION: starting budgets revised after load test.
- Related: D08 offline queue (PROVISIONAL, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
