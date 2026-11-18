# PS-064-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (LOCATION_PRECISE log rule), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-08.R01 | Each command, transition, sweep and point read emits counter and latency. | MVP |
| PS-064-08.R02 | `ProposeMeetup` p95 ≤ 300 ms; `ShareMeetupPoint` p95 ≤ 300 ms; expiry lag p95 ≤ 5 min. | MVP |
| PS-064-08.R03 | Logs carry `meetup_id`, state and code only; never point, place text or venue address. | MVP |
| PS-064-08.R04 | No meetup, venue or participant IDs as metric labels; no coordinates anywhere in metrics. | MVP |
| PS-064-08.R05 | Alerts: expiry lag > 15 min; any point read after expiry (should be zero); no-show report spike. | MVP |
| PS-064-08.R06 | Meetup planning UI and point map fallback (text description) meet WCAG 2.1 AA. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `coord_cmd_total` | counter | `command`, `result` |
| `coord_transition_total` | counter | `from`, `to` |
| `coord_expiry_lag_seconds` | histogram | none |
| `coord_point_read_expired_total` | counter | none |
| `coord_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers PS-064-04 paths.

## States & transitions
Transition counters per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Counters by code only.

## Authorization
Dashboards for F08 and F16; no per-meetup views.

## Failure, idempotency, concurrency, offline
Sweep backlog as aggregate.

## Privacy, retention, abuse
Operational logs 30 days; metrics 13 months aggregated; audit 12 months.

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 50 proposals/s peak, 200 point reads/s (ASSUMPTION).

## Tests
- TEST-PS-064-08-01 (unit): counters once per command.
- TEST-PS-064-08-02 (privacy scan): no coordinates in logs or metrics.
- TEST-PS-064-08-03 (load): 200 point reads/s within budget.
- TEST-PS-064-08-04 (a11y): map fallback text and form errors announced.

## Acceptance criteria
1. Dashboards and alerts exist.
2. Zero point reads after expiry in test run.
3. Redaction verified.
4. Budgets met.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- PROVISIONAL (D07 default, unapproved): 30-day log retention.
