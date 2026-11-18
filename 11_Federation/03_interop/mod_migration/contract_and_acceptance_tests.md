# PS-090-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R09), CTR-EVT-001, CTR-FED-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-09.R01 | Golden fixtures for every from-version migration path (CTR-SCH-001 R09). | MVP |
| PS-090-09.R02 | Contract tests for every MIGRATE.* code. | MVP |
| PS-090-09.R03 | Acceptance test: plan, dual approve, execute, verify, rollback within window. | MVP |

## Data / schema
Fixtures: two schema versions with hook, one lossy hook (must be rejected), one signed claim, one historic key.

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
Synthetic fixtures.

## Observability & budgets
Suite ≤ 10 min (ASSUMPTION).

## Tests
- TEST-PS-090-09-01 (golden): each migration path reproduces expected output.
- TEST-PS-090-09-02 (acceptance): full lifecycle including rollback.
- TEST-PS-090-09-03 (property): migrate then reverse view yields original fields for lossless hooks only.

## Acceptance criteria
1. Golden fixtures for all paths.
2. Lifecycle test passes.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
