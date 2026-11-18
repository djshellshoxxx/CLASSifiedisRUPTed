# PS-036-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-08.R01 | Evaluation lag p95 ≤ 1 s after bid acceptance; p99 ≤ 3 s. | MVP |
| PS-036-08.R02 | Logs: `code`, `request_id`, module, timing, `auc_` and `bid_id`. No account identifiers. | MVP |
| PS-036-08.R03 | Alert on any `reconciliation_repairs` > 0 in 1 h and on evaluation lag p99 > 3 s for 5 min. | MVP |
| PS-036-08.R04 | Dashboards show extension and cap counts; no per-bidder views. | MVP |

## Data / schema
Metric labels allowed: `code`, `action`, `state`. Forbidden: `auc_`, `bid_`, `acc_`.

## Commands / queries / events
Spans with `request_id` and `correlation_id`.

## States & transitions
State metrics from PS-036-03.

## Validation & errors
`antisnip_validation_rejections_total{code}`.

## Authorization
Operator dashboards: counts only.

## Failure, idempotency, concurrency, offline
Telemetry best-effort; never blocks evaluation.

## Privacy, retention, abuse
Telemetry 30 days (ASSUMPTION). Allowlisted trace attributes.

## Observability & budgets
| Metric | Target |
|---|---|
| `antisnip_evaluation_lag_seconds` p95 | ≤ 1 s |
| `antisnip_reconciliation_repairs_total` | 0 steady state |
| `antisnip_cap_reached_total` | reported daily |
| Evaluation error rate | ≤ 0.1% |

## Tests
- TEST-PS-036-08-01 (unit): log formatter drops account identifiers.
- TEST-PS-036-08-02 (load): 1,000 bid events per second across 1,000 auctions meets R01.
- TEST-PS-036-08-03 (lint): metric labels contain no forbidden label.
- TEST-PS-036-08-04 (alert): repair counter above 0 fires alert.

## Acceptance criteria
1. Budgets measured in staging (future phase gate).
2. Log sample of 10,000 lines has zero account identifiers.
3. Alerts configured.

## Assumptions & open decisions
- ASSUMPTION: starting budgets revised after load test.
- See [DECISIONS.md](../../../DECISIONS.md) D10 for identity rules (not used by this module's metrics).
