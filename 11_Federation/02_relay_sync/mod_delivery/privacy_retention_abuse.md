# PS-088-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R03, R10–R12), CTR-PRV-001 (R03, R09), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-07.R01 | Restricted classes (PRIVATE_PERSONAL, LOCATION_PRECISE, SECRET, FINANCIAL_EVIDENCE) are refused at enqueue (CTR-FED-001 R03). | MVP |
| PS-088-07.R02 | Outbound batches are delayed a random 0–60 s to reduce timing correlation (CTR-FED-001 R12). | MVP |
| PS-088-07.R03 | Queue rows deleted 24 h after terminal status (ASSUMPTION). | MVP |
| PS-088-07.R04 | Abuse: per-peer limits (600 events/min, 10 MiB/h) and alert on sustained limit hits for 3 h. | MVP |

## Data / schema
Queue rows PSEUDONYMOUS (peer and event IDs).

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Deletion after terminal status is a retention step, not a state in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
`FED.DATA_CLASS_NOT_ALLOWED` (403) at enqueue.

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Purge idempotent per row.

## Privacy, retention, abuse
Retention above. No payload logging.

## Observability & budgets
Alert on R04.

## Tests
- TEST-PS-088-07-01 (privacy): LOCATION_PRECISE event refused at enqueue.
- TEST-PS-088-07-02 (timing): batch send time within 0–60 s after schedule.
- TEST-PS-088-07-03 (abuse): sustained limit hits alert.

## Acceptance criteria
1. Restricted classes never enqueued.
2. Jitter bound verified.

## Assumptions & open decisions
- ASSUMPTION: 24 h purge; alert window.
- PROVISIONAL (D07 default, unapproved).
