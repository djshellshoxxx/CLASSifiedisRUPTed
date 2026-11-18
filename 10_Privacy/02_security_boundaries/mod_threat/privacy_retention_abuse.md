# PS-082-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R08), CTR-EVT-001 (R06), CTR-FED-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-07.R01 | Register contains no user data, no sample payloads and no secret material (CTR-PRV-001 R08). | MVP |
| PS-082-07.R02 | Register is never federated or exported to peers (CTR-FED-001 scope). | MVP |
| PS-082-07.R03 | Closed threats retained 1 year after closure, then archived read-only (ASSUMPTION). | MVP |
| PS-082-07.R04 | Abuse: bulk reads of the register by any reviewer above 50 threats per hour raise an alert (ASSUMPTION). | MVP |

## Data / schema
Data class: PUBLIC for titles without data; restricted for exploit detail (internal class, PENDING CTR-PRV-001 classification review).

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Archival is a state change in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
`THREAT.TITLE_CONTAINS_DATA` (PS-082-02.R05).

## Authorization
Per PS-082-05.

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-082-06.

## Privacy, retention, abuse
Retention: active indefinite; closed 1 year (ASSUMPTION). Abuse: bulk-read alert (R04). Exploit detail never leaves the register.

## Observability & budgets
Alert on R04 and on any export attempt.

## Tests
- TEST-PS-082-07-01 (privacy): scan finds no data in titles.
- TEST-PS-082-07-02 (federation): register export refused for peer principals.
- TEST-PS-082-07-03 (abuse): 51st read in an hour raises alert.

## Acceptance criteria
1. Scan passes.
2. Peer export refused.
3. Bulk-read alert fires in test.

## Assumptions & open decisions
- ASSUMPTION: 1-year closed retention; 50/h read threshold.
- PROVISIONAL (D07 default, unapproved).
