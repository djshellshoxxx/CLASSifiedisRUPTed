# PS-108-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-08.R01 | Release lag after `ends_at` p95 ≤ 30 s, p99 ≤ 5 min. | MVP |
| PS-108-08.R02 | Held backlog metric by category, no account label. | MVP |
| PS-108-08.R03 | Alert when release lag > 5 min. | MVP |
| PS-108-08.R04 | Logs exclude period bounds and zones. | MVP |

## Data / schema
Metrics: `quiet_active_periods`, `quiet_held_total{channel,category}`, `quiet_release_lag_seconds`, `quiet_release_late_total`.

## Commands / queries / events
Spans carry `request_id` only.

## States & transitions
Gauges match states.

## Validation & errors
Counts by code.

## Authorization
Dashboards aggregate only.

## Failure, idempotency, concurrency, offline
Alert on duplicate release detection.

## Privacy, retention, abuse
Metrics 30 days.

## Observability & budgets
Release job CPU ≤ 2% at 10 000 releases/min (ASSUMPTION).

## Tests
- TEST-PS-108-08-01 (integration): lag alert fires at 6 min simulated delay.
- TEST-PS-108-08-02 (unit): label cardinality check.
- TEST-PS-108-08-03 (contract): log scan.
- TEST-PS-108-08-04 (load): 10 000 releases per minute.

## Acceptance criteria
1. Metrics documented.
2. Alert verified.
3. Load test not yet run.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- No Dxx directly applies.
