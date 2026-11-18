# PS-034-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-08.R01 | Close lag p95 ≤ 5 s after effective end; p99 ≤ 15 s. | MVP |
| PS-034-08.R02 | Logs: `code`, `request_id`, module, timing, `auc_` ID. No winner, reserve, amounts or `acc_`. | MVP |
| PS-034-08.R03 | Alert when any auction is in `ENDED_SOLD` longer than 48 h + 1 h, and when reconciliation repairs exceed 0 per hour. | MVP |
| PS-034-08.R04 | Dashboards show end-state counts only. | MVP |

## Data / schema
Metric labels allowed: `end_state`, `code`, `from`, `to`, `step`. Forbidden: `acc_`, `auc_`, amounts, reserve flags per auction.

## Commands / queries / events
Spans carry `request_id`, `correlation_id`.

## States & transitions
State metrics from PS-034-03.

## Validation & errors
`close_validation_rejections_total{code}`.

## Authorization
Operator dashboards: counts only.

## Failure, idempotency, concurrency, offline
Telemetry best-effort; never blocks close.

## Privacy, retention, abuse
Telemetry 30 days (ASSUMPTION). Allowlisted attributes. Seller-flag counts forwarded to F12 as aggregates.

## Observability & budgets
| Metric | Target |
|---|---|
| `close_lag_seconds` p95 | ≤ 5 s |
| `close_duplicate_records_total` | 0 |
| `close_confirm_pending_total` (48 h+) | alert > 0 |
| 5xx rate on close | ≤ 0.1% |

## Tests
- TEST-PS-034-08-01 (unit): log formatter drops winner, reserve and amounts.
- TEST-PS-034-08-02 (load): 1,000 auctions closing in one minute meet R01.
- TEST-PS-034-08-03 (lint): metric label set has no forbidden label.
- TEST-PS-034-08-04 (alert): stuck ENDED_SOLD fires at 49 h.

## Acceptance criteria
1. Budgets measured in staging (future phase gate).
2. Log sample of 10,000 lines has zero winner or reserve values.
3. Alerts configured for stuck confirmations and duplicate records.

## Assumptions & open decisions
- ASSUMPTION: budgets revised after load test.
- Related: D08 offline queue (PROVISIONAL, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
