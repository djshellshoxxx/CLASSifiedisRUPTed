# PS-106-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-08.R01 | Unread count p95 ≤ 50 ms; list page p95 ≤ 150 ms. | MVP |
| PS-106-08.R02 | Projection lag p95 ≤ 5 s. | MVP |
| PS-106-08.R03 | Prune job failure rate < 0.1% per run, alert otherwise. | MVP |
| PS-106-08.R04 | Logs carry no `object_ref` or `group_key` in clear. | MVP |

## Data / schema
Metrics: `inbox_projection_lag_seconds`, `inbox_prune_deleted_total`, `inbox_items{state}`, `inbox_query_seconds{query}`.

## Commands / queries / events
Spans carry `request_id` only.

## States & transitions
Gauges by state from workflow_state_machine.

## Validation & errors
Counts by code.

## Authorization
Operator dashboards aggregate only.

## Failure, idempotency, concurrency, offline
Alert on replay duplicates (should be 0).

## Privacy, retention, abuse
Metrics 30 days; traces 7 days (ASSUMPTION).

## Observability & budgets
Projection worker memory ≤ 256 MB (ASSUMPTION).

## Tests
- TEST-PS-106-08-01 (load): unread count p95 under 1000 queries/s.
- TEST-PS-106-08-02 (unit): label cardinality check.
- TEST-PS-106-08-03 (contract): log scan finds no `group_key`.
- TEST-PS-106-08-04 (integration): prune failure raises alert.

## Acceptance criteria
1. Metrics documented.
2. Budgets verified in load test (not yet run).
3. Cardinality test passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- No Dxx directly applies.
