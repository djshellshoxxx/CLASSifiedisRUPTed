# PS-038-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-08.R01 | Counters: `sniping_classified_total{class}`, `sniping_rejected_after_close_total`, `sniping_clock_degraded_seconds`. | MVP |
| PS-038-08.R02 | Classification p95 <= 50 ms; record endpoint p95 <= 100 ms. | MVP |
| PS-038-08.R03 | Clock skew gauge per node with p99 reported. | MVP |
| PS-038-08.R04 | Logs carry `timing_id` prefix only; no bidder_id, no timestamps of individual bids. | MVP |
| PS-038-08.R05 | Dashboards show aggregates with k >= 5. | MVP |

## Data / schema
Metric labels: `class`, `acceptance`, `node`. No account labels.

## Commands / queries / events
Alert event `sniping.skew_alert` internal only.

## States & transitions
Not applicable.

## Validation & errors
Redaction test rejects `acc_` tokens and ISO timestamps tied to a bid in log lines.

## Authorization
Dashboard read requires `sniping.read_summary` for operator aggregate role (ops).

## Failure, idempotency, concurrency, offline
Metrics are best-effort; loss does not block bid recording.

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION). Traces drop bid payloads.

## Observability & budgets
Budget: 2,000 bids/min per platform (ASSUMPTION), <= 2% CPU overhead.

## Tests
- TEST-PS-038-08-01 (redaction): log fixture with bidder and timing values is redacted.
- TEST-PS-038-08-02 (performance): 2,000 bids/min meets R02.
- TEST-PS-038-08-03 (alert): skew above 500 ms for 3 checks raises alert.

## Acceptance criteria
1. Counters present in staging.
2. Zero bidder_id leaks in logs.
3. p95 budgets met under fixture load.

## Assumptions & open decisions
- ASSUMPTION: 2,000 bids/min planning budget.
- PROVISIONAL (D07 default, unapproved): 30-day telemetry retention.
