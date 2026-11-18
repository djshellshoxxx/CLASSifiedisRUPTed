# PS-105-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-08.R01 | `hours.evaluate` p95 ≤ 5 ms, p99 ≤ 15 ms, with 10 000 accounts per node cache. | MVP |
| PS-105-08.R02 | `hours.set_windows` p95 ≤ 200 ms. | MVP |
| PS-105-08.R03 | Deferred backlog older than 2 h raises alert. | MVP |
| PS-105-08.R04 | Logs redact window content and `tz` (PS-105-07.R03). | MVP |

## Data / schema
Metrics (bounded labels): `hours_evaluations_total{outcome}`, `hours_deferred_backlog{channel}`, `hours_evaluate_seconds`, `hours_tzdata_version` (info gauge).

## Commands / queries / events
Trace spans carry `request_id`, `correlation_id`; attributes exclude window values.

## States & transitions
Outcome labels match workflow_state_machine decisions.

## Validation & errors
Counts by `code` only.

## Authorization
Dashboards show aggregates only; no per-account series.

## Failure, idempotency, concurrency, offline
Dashboard shows evaluator error rate; replay counter tracks duplicate evaluation attempts (should be 0 for delivered).

## Privacy, retention, abuse
Metrics retention 30 days (RET-OPS). No per-account labels.

## Observability & budgets
- Cache memory ≤ 64 MB per node (ASSUMPTION).
- Evaluate CPU ≤ 2% at 1000 evaluations/s.

## Tests
- TEST-PS-105-08-01 (load): evaluate p95 ≤ 5 ms at 1000/s.
- TEST-PS-105-08-02 (unit): label cardinality check rejects account-scoped labels.
- TEST-PS-105-08-03 (integration): backlog alert fires when a deferred item is 2 h overdue.
- TEST-PS-105-08-04 (contract): log fixtures contain no `tz` value.

## Acceptance criteria
1. Metrics listed exist and are documented.
2. Load test run (not yet executed; not claimed).
3. Cardinality test passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- No Dxx directly applies.
