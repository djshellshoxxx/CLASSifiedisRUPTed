# PS-131-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-06.R01 | Declaration is idempotent on (`actor`, `command`, `idempotency_key`) for 7 days (CTR-EVT-001 R03). | MVP |
| PS-131-06.R02 | Timeline append is idempotent on `entry_digest`. | MVP |
| PS-131-06.R03 | Incident records remain writable during partial outage of notification services; notifications queue. | MVP |
| PS-131-06.R04 | Restore from backup must reproduce the timeline hash chain head. | MVP |
| PS-131-06.R05 | The module never auto-closes an incident. | MVP |

## Data / schema
Idempotency and queue records only; no extra incident fields.

## Commands / queries / events
SLA timers are durable (stored, not in-memory) and survive restart.

## States & transitions
Crash mid-transition: state write and event are one transaction (outbox if separate store).

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| INCIDENT.NOTIFY_QUEUED | unavailable (503) | true | err.incident.notify_queued |

## Authorization
N/A beyond [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Responder offline: local draft queued (D08), sent with original `occurred_at`; server records `recorded_at`.
- Duplicate declarations from detectors are merged by the operator into one incident; the module does not auto-merge.
- Timers recover after restart and emit breach events once (idempotent by timer ID).

## Privacy, retention, abuse
Queue entries hold no timeline text beyond encrypted payload (ASSUMPTION).

## Observability & budgets
Metric `incident_notify_queue_depth`; alert > 100 for 10 min.

## Tests
- TEST-PS-131-06-01: chaos, kill process after declare; one incident after restart.
- TEST-PS-131-06-02: integration, notification outage queues and drains.
- TEST-PS-131-06-03: restore, chain head matches.

## Acceptance criteria
1. Zero duplicate incidents from retried declarations.
2. Restore reproduces chain head in 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: queue encryption at rest via F15 storage.
- D08 (offline reporting): PROVISIONAL (D08 default, unapproved).
