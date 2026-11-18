# PS-136-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-04.R01 | `property.run` is idempotent by (`property_id`, `build_sha`, `seed`). | MVP |
| PS-136-04.R02 | `property.replay` takes (`counterexample_id`) and re-runs it deterministically. | MVP |
| PS-136-04.R03 | `property.register` rejects duplicates by `property_id`. | MVP |
| PS-136-04.R04 | Result query p95 ≤ 200 ms (ASSUMPTION). | MVP |

## Data / schema
Command bodies reference records in [domain_schema.md](domain_schema.md).

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| property.register | command | PROPERTY.SOURCE_MISSING, PROPERTY.GENERATOR_INVALID, PROPERTY.BUDGET_TOO_LOW |
| property.run | command | PROPERTY.BUDGET_TOO_LOW, SYS.UNAVAILABLE |
| property.replay | command | SYS.NOT_FOUND |
| property.get / property.list_failing | query | SYS.NOT_FOUND |
| property_run.queued / started / passed / failed / errored; counterexample.recorded | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate run with same key returns existing run.

## Privacy, retention, abuse
Events carry property IDs and seeds only.

## Observability & budgets
Latency and error counters.

## Tests
- TEST-PS-136-04-01: contract, event schemas.
- TEST-PS-136-04-02: replay of stored counterexample reproduces failure.

## Acceptance criteria
1. Every counterexample replays from its stored seed.
2. Duplicate registration rejected.

## Assumptions & open decisions
- ASSUMPTION: seeds are uint64.
- D02 default for cycle property seeds: PROVISIONAL (D02 default, unapproved).
