# PS-060-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (log classes), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-08.R01 | Each command, delivery and purge emits counter and latency. | MVP |
| PS-060-08.R02 | `SendMessage` p95 ≤ 300 ms; delivery lag online p95 ≤ 3 s; `ListMessages` p95 ≤ 150 ms. | MVP |
| PS-060-08.R03 | Logs carry `thread_id`, `msg_id`, command and code only; never bodies or sender names. | MVP |
| PS-060-08.R04 | No thread, message or participant IDs as metric labels. | MVP |
| PS-060-08.R05 | Alerts: outbox lag > 30 s; blocked-send attempt spike (abuse signal); report-rate spike. | MVP |
| PS-060-08.R06 | Message list and composer meet WCAG 2.1 AA; new-message announcements are polite, not assertive. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `privmsg_cmd_total` | counter | `command`, `result` |
| `privmsg_delivery_lag_seconds` | histogram | none |
| `privmsg_outbox_lag_seconds` | gauge | none |
| `privmsg_queue_not_applied_total` | counter | `code` |
| `privmsg_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers PS-060-04 paths.

## States & transitions
`privmsg_transition_total{from,to}`.

## Validation & errors
Counters by code only.

## Authorization
Dashboards for F08 and F16 operators; no per-thread views.

## Failure, idempotency, concurrency, offline
Device queue depth as aggregate.

## Privacy, retention, abuse
Operational logs 30 days; metrics 13 months aggregated; audit 12 months.

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 500 sends/s peak; 5,000 concurrent connections (ASSUMPTION).

## Tests
- TEST-PS-060-08-01 (unit): one counter per command.
- TEST-PS-060-08-02 (privacy scan): no content or IDs in logs or metrics.
- TEST-PS-060-08-03 (load): 500 sends/s within budget.
- TEST-PS-060-08-04 (a11y): announcement politeness verified.

## Acceptance criteria
1. Dashboards and alerts exist.
2. Redaction verified.
3. Budgets met under load.
4. No per-thread label.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- PROVISIONAL (D07 default, unapproved): 30-day log retention.
