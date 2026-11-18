# PS-053-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-09.R01 | Every event and command schema has a valid and an invalid fixture (CTR-SCH-001 R09). | MVP |
| PS-053-09.R02 | Transition table fully covered; property test over random command interleavings. | MVP |
| PS-053-09.R03 | Negative tests for enumeration, brute force, replay and support-access denial. | MVP |
| PS-053-09.R04 | Accessibility: recovery forms pass WCAG 2.1 AA checks (labels, error text, focus order). Mobile viewport 360 px. | MVP |

## Data / schema
Fixtures stored under `tests/fixtures/recovery/` at implementation; no real contact addresses.

## Commands / queries / events
Contract tests replay each command with a fixed `Idempotency-Key`.

## States & transitions
Covered by TEST-PS-053-05 and -06 (see [workflow_state_machine](workflow_state_machine.md)).

## Validation & errors
One test per code in [validation_rules](validation_rules.md).

## Authorization
One test per matrix row in [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection tests per [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Log scan test (TEST-PS-053-15).

## Observability & budgets
Test run time ≤ 4 min for the recovery suite in CI.

## Tests
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-053-01 | unit | schema lint, class per field |
| TEST-PS-053-02 | unit | no plaintext secret in storage dump |
| TEST-PS-053-03 | unit | malformed input table |
| TEST-PS-053-04 | integration | enumeration uniformity |
| TEST-PS-053-05 | unit | state table rows |
| TEST-PS-053-06 | property | no completion before cooldown |
| TEST-PS-053-07 | contract | routes vs CTR-EVT-001 and CTR-ERR-001 |
| TEST-PS-053-08 | integration | idempotent start replay |
| TEST-PS-053-09 | unit | authorization matrix |
| TEST-PS-053-10 | unit | proof token scope |
| TEST-PS-053-11 to -14 | integration | outbox retry, concurrency, rollback, offline |
| TEST-PS-053-15 to -20 | integration/e2e | redaction, caps, IP, metrics, load, accessibility (R04) |

## Acceptance criteria
1. TEST-PS-053-01 to -23 pass in CI.
2. Contract tests pass against the CTR-EVT-001 and CTR-SCH-001 versions pinned in the registry.

## Assumptions & open decisions
- ASSUMPTION: load test profile 200 req/s.
- PROVISIONAL (D10 default, unapproved).
