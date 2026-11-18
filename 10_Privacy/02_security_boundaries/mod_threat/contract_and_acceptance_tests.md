# PS-082-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-09.R01 | Golden fixtures for `threat.*` schema versions. | MVP |
| PS-082-09.R02 | Contract tests for all five THREAT.* codes. | MVP |
| PS-082-09.R03 | Acceptance tests for every row of the state table. | MVP |

## Data / schema
Fixtures: seeded threats from PROJECT_SPEC risks, one tampered mitigation, one expired acceptance.

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
Synthetic fixtures only.

## Observability & budgets
Suite ≤ 5 min (ASSUMPTION).

## Tests
- TEST-PS-082-09-01 (contract): schema gate passes.
- TEST-PS-082-09-02 (acceptance): full lifecycle including dual-approved acceptance.
- TEST-PS-082-09-03 (property): no sequence yields `mitigated` without passing test IDs.

## Acceptance criteria
1. Fixtures for all supported versions.
2. Lifecycle test passes.
3. Requirement-to-test map complete.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
- PENDING: seeded threat list confirmation with Security Lead.
