# PS-084-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09, R10), CTR-FED-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-09.R01 | Golden fixtures for registry and flag schemas. | MVP |
| PS-084-09.R02 | Contract tests for all RECORDS.* codes. | MVP |
| PS-084-09.R03 | Acceptance test: owner opts in, bundle includes item; opts out, next bundle excludes it. | MVP |

## Data / schema
Fixtures: one row per federate_mode, one restricted type, one cell set.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
[failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Synthetic data.

## Observability & budgets
Suite ≤ 5 min (ASSUMPTION).

## Tests
- TEST-PS-084-09-01 (contract): schema gate.
- TEST-PS-084-09-02 (acceptance): opt-in and opt-out path.
- TEST-PS-084-09-03 (property): no `never` type ever appears in a bundle fixture.

## Acceptance criteria
1. Fixtures present.
2. Acceptance passes.
3. Requirement-to-test map complete.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
