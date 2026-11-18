# PS-030-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-09.R01 | Consumer contract with F09.S02.M02 canonical dispute API: fixtures for open, add_evidence, respond, withdraw and refusal codes. | MVP |
| PS-030-09.R02 | Consumer contract with F03.S02.M02 milestones: subject state fixtures for eligibility and window. | MVP |
| PS-030-09.R03 | Producer contract for `service_dispute.link_opened` and `service_dispute.link_refused` per CTR-SCH-001. | MVP |
| PS-030-09.R04 | Claim-state contract: `DISPUTED` transition fixture per CTR-COM-001 R05 and R16; label catalog test per R15. | MVP |
| PS-030-09.R05 | Negative tests for every code in [validation_rules.md](validation_rules.md). | MVP |
| PS-030-09.R06 | E2E: client opens dispute on submitted milestone; provider responds within 7 days; F09 decides; link and claim states consistent. | MVP |
| PS-030-09.R07 | A11y: reason selector and note field keyboard-operable, labels announced, error summary focusable. | MVP |
| PS-030-09.R08 | Offline e2e: draft kept; open refused offline with a clear message key. | MVP |

## Data / schema
Fixtures synthetic only; one fixture per schema version and migration path (CTR-SCH-001 R09).

## Commands / queries / events
Contract matrix rows per command and event in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Invariant tests: no local transition outside the table in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Assert `code`, `retryable`, `message_key`, and no input echo (CTR-ERR-001 R05–R07).

## Authorization
Allow/deny per row of [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Contract tests for replay and unknown-outcome paths in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
No production data; fixtures use synthetic `acc_` IDs.

## Observability & budgets
Contract suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-030-09-01 contract: F09 dispute API fixtures.
- TEST-PS-030-09-02 contract: claim `DISPUTED` transition within window.
- TEST-PS-030-09-03 e2e: R06 flow.
- TEST-PS-030-09-04 a11y: R07 checks.
- TEST-PS-030-09-05 offline: R08 flow.

## Acceptance criteria
1. Each command, event and error code has at least one passing test.
2. E2E flow R06 passes with consistent link and claim states.
3. No label contains "paid", "payment received" or "settled" below FINAL.

## Assumptions & open decisions
- ASSUMPTION: contract suite CI budget 10 min.
- Dependency: F09.S02.M02 fixtures PENDING (owner confirmation of canonical record).
- Payment checklist applies.
