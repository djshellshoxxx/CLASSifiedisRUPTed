# PS-061-08 — observability performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 logs), CTR-ERR-001 (R10 logging), CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-08.R01 | `msg.send` server commit p95 ≤ 300 ms, p99 ≤ 800 ms, measured at API edge (ASSUMPTION). | MVP |
| PS-061-08.R02 | `thr.list` p95 ≤ 150 ms for 50 items. `msg.page` p95 ≤ 150 ms for 50 items. | MVP |
| PS-061-08.R03 | `att.complete` p95 ≤ 2 s for a 2 MiB image (ASSUMPTION). | MVP |
| PS-061-08.R04 | Availability target 99.9% monthly for send and read paths (ASSUMPTION). | MVP |
| PS-061-08.R05 | Logs and traces contain no `body_text`, filenames or EXIF values (CTR-ERR-001 R10). | MVP |
| PS-061-08.R06 | Client-side: time from send tap to "sent" state ≤ 100 ms p95 with optimistic `pending_local` (D08). | MVP |

## Data / schema
Metric names: `threads_command_total{cmd,outcome}`, `threads_command_latency_ms{cmd}` (histogram), `threads_queue_depth{client_bucket}`, `threads_upload_orphaned_total`, `threads_authz_denied_total{action,reason_code}`. Labels contain no `acc_` values.

## Commands / queries / events
Event lag metric: `threads_event_lag_ms` from `recorded_at` to subscriber ack, p95 ≤ 2 s (ASSUMPTION).

## States & transitions
Not applicable beyond metrics on transitions in [PS-061-03](workflow_state_machine.md).

## Validation & errors
Rejection counters by code: `threads_validation_reject_total{code}`. Codes only.

## Authorization
Authorization denial counters as in [PS-061-05](authorization_capabilities.md). Denial spikes alert.

## Failure, idempotency, concurrency, offline
Dashboards show replay rate and conflict rate (`EVT.REVISION_CONFLICT`). Conflict rate > 2% of sends over 15 min alerts (ASSUMPTION).

## Privacy, retention, abuse
Metrics are aggregate. Trace spans carry opaque IDs only. Retention RET-OPS, 30 days.

## Observability & budgets
| Budget | Target | Source |
|---|---|---|
| msg.send p95 | ≤ 300 ms | R01 |
| thr.list p95 | ≤ 150 ms | R02 |
| att.complete p95 | ≤ 2 s | R03 |
| Monthly availability | ≥ 99.9% | R04 |
| Orphan upload rate | ≤ 1% / day | PS-061-06 |

Alerts: availability burn-rate; any log line matching body-text fixture; authz denial spike.

## Tests
- TEST-PS-061-08-01 (performance): load test at 2× expected peak; p95 targets met.
- TEST-PS-061-08-02 (logs): synthetic body and EXIF fixture never appear in captured logs or traces.
- TEST-PS-061-08-03 (metrics): every metric in the Data list is emitted in staging with stated labels only.

## Acceptance criteria
1. Latency budgets met in load test (TEST-PS-061-08-01).
2. Log redaction test passes in CI (TEST-PS-061-08-02).

## Assumptions & open decisions
- ASSUMPTION: budgets above are pre-launch targets, not measured data.
- D08 (PWA offline writes): PROVISIONAL (D08 default, unapproved) affects R06 measurement method.
