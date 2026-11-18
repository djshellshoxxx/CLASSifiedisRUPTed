# PS-084-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R02, R03), CTR-PRV-001 (R03, R04), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-07.R01 | Flags never reveal location; `cell` mode publishes only registered cells with K ≥ 5 (CTR-PRV-001 R04, ASSUMPTION). | MVP |
| PS-084-07.R02 | Registry rows are public metadata; no owner identity in registry. | MVP |
| PS-084-07.R03 | Abuse: rapid federate toggling above 20 per item per hour returns `SYS.RATE_LIMITED` (ASSUMPTION). | MVP |
| PS-084-07.R04 | Flag history retained 12 months then reduced to counts (ASSUMPTION). | MVP |

## Data / schema
Flag fields PSEUDONYMOUS; registry PUBLIC.

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
History reduction is a retention job.

## Validation & errors
`SYS.RATE_LIMITED` for toggling.

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retention job idempotent per item and month.

## Privacy, retention, abuse
Retention above; toggle limit above; no location in flags.

## Observability & budgets
Alert on toggling spikes.

## Tests
- TEST-PS-084-07-01 (privacy): cell below K not federated.
- TEST-PS-084-07-02 (abuse): 21st toggle in an hour rate limited.
- TEST-PS-084-07-03 (retention): history reduced at 12 months in fixture clock.

## Acceptance criteria
1. Cell suppression test passes.
2. Toggle limit tested.
3. Retention job tested.

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5; toggle limit 20/h; 12-month history.
- PROVISIONAL (D05 default, unapproved): coarse public regions with user-initiated precision disclosure.
