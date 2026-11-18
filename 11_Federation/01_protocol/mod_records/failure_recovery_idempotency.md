# PS-084-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-FED-001 (Failure section).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-06.R01 | A flag change and its event commit together or not at all. | MVP |
| PS-084-06.R02 | Duplicate flag command returns original result. | MVP |
| PS-084-06.R03 | If the registry is unavailable, federation of items fails closed (no bundles built). | MVP |

## Data / schema
Revision fields per [domain_schema.md](domain_schema.md).

## Commands / queries / events
Retry rules apply to [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | registry unavailable |
| EVT.REVISION_CONFLICT | false | concurrent flag change |

## Authorization
Retries re-authorize.

## Failure, idempotency, concurrency, offline
Concurrency via `expected_revision`. Offline flag changes queued (D08) and applied only at acknowledgement.

## Privacy, retention, abuse
Logs carry IDs and codes only.

## Observability & budgets
`records_failclosed_total`.

## Tests
- TEST-PS-084-06-01 (atomic): crash between write and event leaves consistent state.
- TEST-PS-084-06-02 (fault): registry outage blocks bundling.
- TEST-PS-084-06-03 (offline): queued opt-in not applied before ack.

## Acceptance criteria
1. No half-applied flags.
2. Fail-closed verified.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved).
