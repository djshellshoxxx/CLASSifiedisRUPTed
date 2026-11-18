# PS-062-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-COM-001 (R04), CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-09.R01 | Contract tests run in CI for `consent.v1` and all `consent.*` events. | MVP |
| PS-062-09.R02 | Every requirement in PS-062-01 to -08 maps to ≥ 1 test ID below. | MVP |
| PS-062-09.R03 | Accessibility: consent control reachable by keyboard; terms readable at 200% zoom; screen reader reads scope and version before action. | MVP |
| PS-062-09.R04 | Cross-module contract test with F02.S03.M01 lock event and F08.S02.M01 offers. | MVP |

## Data / schema
Fixtures in `fixtures/consent/`: valid record, duplicate-given record, scope-missing request, stale version, quote-expired cross-currency request.

## Commands / queries / events
Contract replay of each command in [PS-062-04](commands_queries_events.md).

## States & transitions
State matrix from [PS-062-03](workflow_state_machine.md).

## Validation & errors
Each code in [PS-062-02](validation_rules.md) asserted.

## Authorization
Matrix from [PS-062-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Offline replay tests from [PS-062-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Tests from [PS-062-07](privacy_retention_abuse.md).

## Observability & budgets
Tests from [PS-062-08](observability_performance.md).

## Tests
| Test ID | Type | Covers |
|---|---|---|
| TEST-PS-062-09-01 | contract | command and event shapes (PS-062-04) |
| TEST-PS-062-09-02 | unit | validation codes (PS-062-02) |
| TEST-PS-062-09-03 | integration | transition table, lock race (PS-062-03) |
| TEST-PS-062-09-04 | property | at most one `given` per (proposal, slot, version) under random interleavings |
| TEST-PS-062-09-05 | e2e | three-party cycle: each party gives consent; lock; one withdraw refused |
| TEST-PS-062-09-06 | offline | queued withdraw after lock rejected (S4-02) |
| TEST-PS-062-09-07 | a11y | keyboard and screen-reader path for give and decline |
| TEST-PS-062-09-08 | negative | guessed slot IDs; body-supplied party ID ignored |

## Acceptance criteria
1. TEST-PS-062-09-01 to -08 and all IDs in PS-062-01 to -08 pass in CI.
2. Zero committed-after-lock withdrawals across the randomized suite.

## Assumptions & open decisions
- ASSUMPTION: fixtures synthetic.
- Future-phase execution only.
