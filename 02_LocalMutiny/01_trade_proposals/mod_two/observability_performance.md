# PS-015-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-08.R01 | Counters: `cycle_proposed_total{size}`, `cycle_locked_total{origin}`, `cycle_expired_total`, `cycle_withdrawn_total{phase}`. | MVP |
| PS-015-08.R02 | Histogram `cycle_time_to_full_accept_seconds` (p50 and p95 targets ≤ 24 h and ≤ 72 h, ASSUMPTION). | MVP |
| PS-015-08.R03 | Lock job p95 ≤ 2 s. Propose p95 ≤ 300 ms. | MVP |
| PS-015-08.R04 | No `cyc_` or `par_` IDs as metric labels. | MVP |

## Data / schema
Metric names as above; `size` label bounded to 2–6.

## Commands / queries / events
Event lag p95 ≤ 5 s.

## States & transitions
Gauge of cycles per status, sampled 60 s.

## Validation & errors
Error counts by code only.

## Authorization
Telemetry under F16 grants.

## Failure, idempotency, concurrency, offline
Metric failures never block commits.

## Privacy, retention, abuse
Pseudonymous logs only; metric retention 30 days (ASSUMPTION).

## Observability & budgets
Alerts: stuck `confirming` beyond deadline + 60 s; lock job failure rate > 1% over 15 min.

## Tests
- TEST-PS-015-08-01 (unit): label allow-list.
- TEST-PS-015-08-02 (performance): 10,000 open cycles, lock job within budget.
- TEST-PS-015-08-03 (integration): stuck-confirming alert fires.

## Acceptance criteria
1. Zero forbidden labels.
2. Budgets met under stated load.

## Assumptions & open decisions
- ASSUMPTION: 10,000 open cycles sizing.
- D07 PROVISIONAL (Dxx default, unapproved): 30-day metric retention.
