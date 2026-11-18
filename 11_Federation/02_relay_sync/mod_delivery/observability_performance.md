# PS-088-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-FED-001 (R10, R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-08.R01 | Queue depth per peer exported; alert > 10,000 open rows (ASSUMPTION). | MVP |
| PS-088-08.R02 | Time from enqueue to acknowledged p95 ≤ 5 min when peer online (ASSUMPTION). | MVP |
| PS-088-08.R03 | Labels exclude payload and event IDs. | MVP |

## Data / schema
Labels: `peer_class`, `code`, `status`.

## Commands / queries / events
Consumes `dlv.*` and `delivery.dropped`.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure never blocks sending.

## Authorization
Platform Lead and on-call.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| delivery_queue_depth{peer_class} | alert > 10,000 |
| delivery_time_to_ack_s p95 | ≤ 300 |
| delivery_dropped_total{reason} | tracked |

## Tests
- TEST-PS-088-08-01 (metric): depth alert fires in fixture.
- TEST-PS-088-08-02 (redaction): no IDs in labels.

## Acceptance criteria
1. Metrics exported.
2. Redaction passes.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
