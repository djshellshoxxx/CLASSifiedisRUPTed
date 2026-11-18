# PS-066-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (logging fields), CTR-PRV-001 (R04, R09), CTR-ERR-001 (R10). **Decisions:** D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-08.R01 | Metrics are emitted as counts or latency histograms with no plan-level labels. | MVP |
| PS-066-08.R02 | Latency targets (p95, server side): propose 500 ms; confirm, check-in, check-out, safe exit 300 ms; `meetup.get` 200 ms. | MVP |
| PS-066-08.R03 | Timer lag p95 ≤ 60 s; alert at 5 min. | MVP |
| PS-066-08.R04 | Log line fields: `meetup_plan_id`, `event_type`, `revision`, `code`, `request_id`, timing. No other fields. | MVP |
| PS-066-08.R05 | Dashboards show aggregates; any breakdown by venue requires ≥ 5 plans. | MVP |

## Data / schema
Metric names: `safe_plans_total{status}`, `safe_command_latency_ms{command}`, `safe_timer_lag_seconds{timer_kind}`, `safe_error_total{code}`, `safe_rate_limited_total{limit}`, `safe_outbox_age_seconds`.

## Commands / queries / events
Per-command latency histogram; per-event counter by `event_type`.

## States & transitions
Gauge of plans per state; derived from events, not from the live table.

## Validation & errors
Error counters by code only. Validation error values are never recorded.

## Authorization
Dashboards are restricted to the Platform Lead and on-call; aggregate views only.

## Failure, idempotency, concurrency, offline
Client-side outbox age reported in aggregate, with no device identifier.

## Privacy, retention, abuse
Metrics retention 30 days; logs 14 days (ASSUMPTION). Trace sampling excludes the body of any safe-exit request.

## Observability & budgets
Alerts: timer lag > 5 min; `SAFE.CHECKIN_CODE_INVALID` > 20% per hour; safe-exit rate above 3x 7-day baseline in any K_MIN-sized group.

## Tests
- TEST-PS-066-08-01 (contract): metric label set lint has no plan or venue label.
- TEST-PS-066-08-02 (load): 500 check-ins per second meet R02 budgets (ASSUMPTION load profile).
- TEST-PS-066-08-03 (integration): timer lag alert fires at 5 min in a staged delay.
- TEST-PS-066-08-04 (unit): log redaction removes any field outside the R04 allowlist.

## Acceptance criteria
1. Latency budgets met in load test.
2. No log or metric contains a venue, window, handle or code.
3. Alerts fire in staging for each named condition.

## Assumptions & open decisions
- ASSUMPTION: 30-day metric and 14-day log retention; load profile is 10x expected peak.
- D07 (PROVISIONAL default, unapproved).
