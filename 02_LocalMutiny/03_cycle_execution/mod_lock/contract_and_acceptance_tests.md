# PS-023-09 — Contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-09.R01 | Examples in PS-023-04 validate against schema 1.0.0 in CI. | MVP |
| PS-023-09.R02 | Scenario: 2-party swap of single items locks both and consumes both on completion. | MVP |
| PS-023-09.R03 | Scenario: 4-party cycle, one item unavailable → all 8 acquired items released. | MVP |
| PS-023-09.R04 | Consumer contract: F01 availability consumes `item.locked` and `item.lock_consumed` idempotently. | MVP |
| PS-023-09.R05 | Accessibility: lock status shown as text ("reserved until ...") not colour alone. | MVP |

## Data / schema
Fixtures in `fixtures/cycle_lock/`: two_party_swap, four_party_conflict, expiry_at_24h, extension_second_attempt.

## Commands / queries / events
Contract tests for each emitted event.

## States & transitions
Scenario tests in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Each code in [validation_rules.md](validation_rules.md) has a fixture.

## Authorization
Matrix from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Race and fault fixtures from [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Uniform-error fixture and privacy log scan.

## Observability & budgets
Load run compared with PS-023-08 budgets.

## Tests
- TEST-PS-023-09-01 (contract): schema examples validate.
- TEST-PS-023-09-02 (e2e): 2-party swap, lock then consume after completion.
- TEST-PS-023-09-03 (e2e): 4-party conflict, full release.
- TEST-PS-023-09-04 (contract): F01 consumer idempotent under duplicate delivery.
- TEST-PS-023-09-05 (a11y): lock state read by screen reader with expiry time.

## Acceptance criteria
1. TEST-PS-023-09-01..05 pass in CI.
2. No scenario ends with a HELD item after cycle terminal state.
3. Duplicate event delivery does not double-decrement availability.

## Assumptions & open decisions
- ASSUMPTION: availability consumer contract owned by F01.S03.M01.
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved).
