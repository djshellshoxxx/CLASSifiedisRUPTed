# PS-117-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-08.R01 | Metric labels are bounded: `route_template`, `method`, `status_class`, `code`, `downstream`. No ID or IP labels. | MVP |
| PS-117-08.R02 | Logs are structured JSON with `request_id`, `correlation_id` (CTR-EVT-001 R09 when present) and `code`. | MVP |
| PS-117-08.R03 | Tracing uses W3C `traceparent`; span attributes contain no `acc_` IDs. | MVP |
| PS-117-08.R04 | Availability target 99.9% monthly for command and read routes (ASSUMPTION). | MVP |

## Data / schema
Metric catalog (Prometheus naming):
- `api_requests_total{route_template,method,status_class}`
- `api_request_duration_seconds{route_template}` (histogram)
- `api_breaker_state{downstream}`, `api_retries_total{downstream}`
- `api_validation_rejections_total{code}`

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failures never fail a request; drop counter `api_telemetry_dropped_total` increments.

## Authorization
Dashboards restricted to Platform Lead and on-call roles (F15, F16 approval).

## Failure, idempotency, concurrency, offline
Telemetry export is asynchronous with a 2 000-record bounded buffer; overflow drops oldest.

## Privacy, retention, abuse
Metrics retained 90 days; traces 7 days; logs 14 days (ASSUMPTION). Trace sampling 10% for success, 100% for errors.

## Observability & budgets
| Route class | p95 target |
|---|---|
| read | ≤ 150 ms |
| command ack | ≤ 300 ms |
| version route | ≤ 20 ms |

Load budget: 500 requests/s sustained per api node with p95 within the table (ASSUMPTION; verified in PS-117-09).

## Tests
- TEST-PS-117-08-01 (unit): label cardinality test rejects unbounded labels.
- TEST-PS-117-08-02 (integration): log redaction canary (see PS-117-07).
- TEST-PS-117-08-03 (load): sustained 500 rps for 30 min meets p95 table.

## Acceptance criteria
1. Dashboards and alerts exist for each metric above before release.
2. Total active series per node ≤ 20 000 (ASSUMPTION).
3. Load test report attached to release record.

## Assumptions & open decisions
- ASSUMPTION: throughput and retention figures.
- D07 (PROVISIONAL default, unapproved): telemetry retention classes above.
