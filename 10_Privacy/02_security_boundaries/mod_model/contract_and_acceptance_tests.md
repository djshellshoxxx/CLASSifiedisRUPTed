# PS-081-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-09.R01 | Schema golden fixtures for every `model.*` and `flow.*` version (CTR-SCH-001 R09). | MVP |
| PS-081-09.R02 | Contract tests cover all five MODEL.* codes. | MVP |
| PS-081-09.R03 | Acceptance tests cover proposal, approval, activation and drift check end to end. | MVP |

## Data / schema
Fixtures: one approved version, one drift case, one tampered version.

## Commands / queries / events
Per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Per [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Fixtures are synthetic.

## Observability & budgets
Suite runtime ≤ 5 min (ASSUMPTION).

## Tests
- TEST-PS-081-09-01 (contract): schema compatibility gate passes.
- TEST-PS-081-09-02 (acceptance): end-to-end approval path.
- TEST-PS-081-09-03 (property): any valid flow set yields coverage ≤ 1.0 and no unclassified flow.

## Acceptance criteria
1. Golden fixtures present for all supported versions.
2. Acceptance and contract tests pass in CI.
3. Every requirement ID in this module maps to a test ID.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
- PENDING CTR-FED-001 consumer list for federation-class rules.
