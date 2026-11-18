# PS-035-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-08.R01 | `reserve.set` p95 ≤ 150 ms server side. | MVP |
| PS-035-08.R02 | MET lag = 0 (same transaction); any non-zero reconciliation is an alert. | MVP |
| PS-035-08.R03 | Logs: `code`, `request_id`, module, timing, `auc_` ID. No reserve value, no `acc_` of the seller. | MVP |
| PS-035-08.R04 | Dashboards show counts of changes and rejections by code only. | MVP |

## Data / schema
Metric labels allowed: `code`, `action`, `from`, `to`. Forbidden: `acc_`, `auc_`, reserve values, amounts.

## Commands / queries / events
Spans with `request_id` and `correlation_id`.

## States & transitions
State metrics from PS-035-03.

## Validation & errors
`reserve_validation_rejections_total{code}`.

## Authorization
Operator dashboards: counts only; no reserve reads.

## Failure, idempotency, concurrency, offline
Telemetry best-effort; never blocks a reserve change or bid acceptance.

## Privacy, retention, abuse
Telemetry 30 days (ASSUMPTION). Allowlisted attributes. Probing-signal counts forwarded to F12 as aggregates.

## Observability & budgets
| Metric | Target |
|---|---|
| `reserve_set_latency_seconds` p95 | ≤ 0.15 s |
| `reserve_met_reconciliation_total` | 0 |
| `reserve_duplicate_history_total` | 0 |
| 5xx rate | ≤ 0.1% |

## Tests
- TEST-PS-035-08-01 (unit): log formatter drops reserve values.
- TEST-PS-035-08-02 (load): 200 reserve changes per second for 10 min meet R01.
- TEST-PS-035-08-03 (lint): metric labels contain no forbidden label.
- TEST-PS-035-08-04 (alert): any reconciliation event fires an alert.

## Acceptance criteria
1. Budgets measured in staging (future phase gate).
2. Log sample of 10,000 lines has zero reserve values.
3. Reconciliation alert configured.

## Assumptions & open decisions
- ASSUMPTION: starting budgets, revised after load test.
- Related: D08 offline queue (PROVISIONAL, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
