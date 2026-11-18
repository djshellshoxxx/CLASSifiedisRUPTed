# PS-129-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-09.R01 | Contract tests run in CI against CTR-SCH-001 registry lint and CTR-EVT-001 envelope schema. | MVP |
| PS-129-09.R02 | Property test: for any random sequence of up to 200 commands, at most one `active` per key class. | MVP |
| PS-129-09.R03 | Golden fixtures for `crypto_policy` v1.0.0 and each future MINOR/PATCH upgrade path (CTR-SCH-001 R09). | MVP |
| PS-129-09.R04 | End-to-end: propose, two approvals, scheduled activation, read by client. | MVP |

## Data / schema
Fixtures stored under the module test directory; no production data.

## Commands / queries / events
Tests drive commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Property test covers every transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Test asserts each error code in [validation_rules.md](validation_rules.md) has a fixture.

## Authorization
Test principals: `ope` (two), `ope` proposer, `user`, `mod`, `sys`.

## Failure, idempotency, concurrency, offline
Replay test with identical idempotency key.

## Privacy, retention, abuse
Fixtures contain synthetic IDs only.

## Observability & budgets
Test suite runtime ≤ 10 min (ASSUMPTION).

## Tests
- TEST-PS-129-09-01: contract, registry lint.
- TEST-PS-129-09-02: property, one active per class.
- TEST-PS-129-09-03: e2e, full governance flow.

## Acceptance criteria
1. Contract suite passes on every merge.
2. Property test runs ≥ 10,000 cases with no violation.
3. E2E flow completes with expected event sequence.

## Assumptions & open decisions
- ASSUMPTION: 10,000 property cases.
- D10 default governs fixtures: PROVISIONAL (D10 default, unapproved).
