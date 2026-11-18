# PS-107-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-08.R01 | `opt.get_matrix` p95 ≤ 50 ms; `opt.set_cell` p95 ≤ 150 ms. | MVP |
| PS-107-08.R02 | Alert when withdrawals spike > 5× 7-day baseline in 1 hour (possible abuse or bad release). | MVP |
| PS-107-08.R03 | Confirmation email delivery success tracked per provider. | MVP |
| PS-107-08.R04 | Logs redact addresses and tokens. | MVP |

## Data / schema
Metrics: `opt_cells{channel,category,state}` gauge, `opt_withdrawals_total{channel,category,source}`, `opt_confirmations_total{outcome}`, `opt_unsubscribe_requests_total{outcome}`.

## Commands / queries / events
Spans exclude addresses and tokens.

## States & transitions
Gauges match workflow_state_machine states.

## Validation & errors
Counts by code.

## Authorization
Operator dashboards show aggregates only.

## Failure, idempotency, concurrency, offline
Alert on repeated confirmation replays.

## Privacy, retention, abuse
Metrics 30 days (RET-OPS).

## Observability & budgets
Withdrawal spike alert latency ≤ 10 min.

## Tests
- TEST-PS-107-08-01 (load): matrix read p95 at 2000 req/s.
- TEST-PS-107-08-02 (unit): cardinality guard rejects account labels.
- TEST-PS-107-08-03 (integration): spike alert fires in simulation.
- TEST-PS-107-08-04 (contract): log scan finds no address or token.

## Acceptance criteria
1. Metrics documented.
2. Alert verified in simulation.
3. Budgets verified in load test (not yet run).

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- No Dxx directly applies.
