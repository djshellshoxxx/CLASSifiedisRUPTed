# PS-022-09 — Contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-09.R01 | Examples in PS-022-04 validate against schema 1.0.0 in CI. | MVP |
| PS-022-09.R02 | Scenario: 3-party cycle, one withdraws after consent → RESOLVED_RESOLVE_AGAIN with successor version. | MVP |
| PS-022-09.R03 | Scenario: 4-party cycle, one attest timeout after lock → case escalated after 7 days, no money moved. | MVP |
| PS-022-09.R04 | Scenario: 2-party cycle, withdrawal before lock → RESOLVED_CANCELLED, locks none. | MVP |
| PS-022-09.R05 | Accessibility: withdrawal flow confirmable by keyboard, with explicit confirmation text (WCAG 2.1 AA). | MVP |

## Data / schema
Fixtures in `fixtures/cycle_dropout/`: timeout_at_lock, timeout_at_attest, withdraw_after_consent, duplicate_report.

## Commands / queries / events
Consumer contract tests for mod_lock and mod_recovery.

## States & transitions
Scenario tests walk [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
One fixture per code in [validation_rules.md](validation_rules.md).

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault-injection fixtures from [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Privacy scan fixtures include seeded `acc_` values and reason codes.

## Observability & budgets
Test run emits metrics snapshot compared with PS-022-08 budgets.

## Tests
- TEST-PS-022-09-01 (contract): schema examples validate.
- TEST-PS-022-09-02 (e2e): 3-party withdraw after consent → successor proposal, consent restarted.
- TEST-PS-022-09-03 (e2e): 4-party attest timeout → escalation, no payment claim created.
- TEST-PS-022-09-04 (e2e): 2-party withdraw before lock → cancelled.
- TEST-PS-022-09-05 (a11y): withdrawal confirmation keyboard-only.

## Acceptance criteria
1. TEST-PS-022-09-01..05 pass in CI.
2. Scenario outcomes match the state table.
3. No scenario creates a claim in FINAL state.

## Assumptions & open decisions
- ASSUMPTION: scenario timers use the test clock.
- [DECISIONS.md](../../../DECISIONS.md) D04 — PROVISIONAL (D04 default, unapproved): fixtures assume per-party outcomes.
