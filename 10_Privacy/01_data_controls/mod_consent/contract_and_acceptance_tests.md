# PS-076-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-09.R01 | Every schema in this module has golden fixtures for each supported `from` version (CTR-SCH-001 R09). | MVP |
| PS-076-09.R02 | Contract tests run in CI against `consent.*` event schemas and error codes. | MVP |
| PS-076-09.R03 | Acceptance tests cover every grant, withdraw, expire and supersede path, including offline replay. | MVP |
| PS-076-09.R04 | Consumer contract test for analytics and federation consumers (PENDING CTR-FED-001 consumer list). | MVP |

## Data / schema
Test fixtures: subjects `acc_` seeded; notice versions `1.0.0`, `1.1.0`; purposes from registry.

## Commands / queries / events
Contract tests exercise [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Acceptance tests drive the table in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Each code in [validation_rules.md](validation_rules.md) has a test.

## Authorization
Matrix from [authorization_capabilities.md](authorization_capabilities.md) is a test table.

## Failure, idempotency, concurrency, offline
Fault injection per [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Test data is synthetic; no production subject data.

## Observability & budgets
Test suite runtime ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-076-09-01 (contract): event schema compatibility check passes against previous PATCH.
- TEST-PS-076-09-02 (acceptance): full state table end to end.
- TEST-PS-076-09-03 (property): random command sequences keep at most one `granted` record per lineage.
- TEST-PS-076-09-04 (a11y): consent prompt meets WCAG 2.1 AA contrast and keyboard path (QA Lead, Accessibility Lead).

## Acceptance criteria
1. TEST-PS-076-01..09 test IDs present and passing.
2. Schema compatibility gate blocks unversioned breaking change (SCH.BREAKING_UNVERSIONED).
3. Acceptance coverage report lists every requirement ID in this module.

## Assumptions & open decisions
- ASSUMPTION: CI runtime limit.
- PENDING CTR-FED-001 consumer list for R04.
