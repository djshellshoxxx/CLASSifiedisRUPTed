# PS-031-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-09.R01 | Consumer contract with F03.S01 listing/quote acceptance (`quote.accepted` event) for plan creation. | MVP |
| PS-031-09.R02 | Consumer contract with F09 claim API: CLAIMED request, idempotent replay, refusal codes. | MVP |
| PS-031-09.R03 | Consumer contract with F03.S02.M03 disputes: `service_dispute.link_opened` moves milestone to `disputed`. | MVP |
| PS-031-09.R04 | Producer contract for the six `milestone.*` events (CTR-SCH-001 registration). | MVP |
| PS-031-09.R05 | Negative tests for every code in [validation_rules.md](validation_rules.md). | MVP |
| PS-031-09.R06 | E2E: 3-milestone plan; provider submits; client accepts; claim created; second milestone auto-accepts after 7 d. | MVP |
| PS-031-09.R07 | A11y: plan list ordering announced; accept/reject controls labelled with amount as text. | MVP |
| PS-031-09.R08 | Offline e2e: queued accept delivered once after reconnect. | MVP |

## Data / schema
Synthetic fixtures; one per schema version and migration path (CTR-SCH-001 R09).

## Commands / queries / events
Contract matrix per row in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Invariant tests from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Assert `code`, `retryable`, `message_key`, no input echo.

## Authorization
Allow/deny per row of [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Replay and claim-queue tests from [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Synthetic data only.

## Observability & budgets
Contract suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-031-09-01 contract: F09 claim API fixtures.
- TEST-PS-031-09-02 contract: dispute link moves state to `disputed`.
- TEST-PS-031-09-03 e2e: R06 flow.
- TEST-PS-031-09-04 a11y: R07 checks.
- TEST-PS-031-09-05 offline: R08 flow.

## Acceptance criteria
1. Each command, event and error has a passing test.
2. R06 flow passes with consistent claim states.
3. No label below FINAL says "paid", "payment received" or "settled".

## Assumptions & open decisions
- ASSUMPTION: contract suite 10 min.
- Dependency: F09 fixtures PENDING.
- Payment checklist applies.
