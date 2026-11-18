# PS-125-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead; test ownership QA Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-09.R01 | Every `TEN.*` code has at least one test that triggers it and asserts its retryable flag and category. | MVP |
| PS-125-09.R02 | Every event in PS-125-04 validates against CTR-EVT-001 in a contract test. | MVP |
| PS-125-09.R03 | Every row in the PS-125-05 matrix has an executable test. | MVP |
| PS-125-09.R04 | Cross-tenant isolation tests run on every release gate. | MVP |

## Data / schema
Fixtures: two tenants (A, B), one ope pair, one mod principal with no grant, one suspended admin, one account under legal hold. Fixtures use synthetic IDs only.

## Commands / queries / events
Contract tests call commands in [PS-125-04](commands_queries_events.md) through the public API only.

## States & transitions
Lifecycle tests cover every row of [PS-125-03](workflow_state_machine.md).

## Validation & errors
Negative tests cover every code in [PS-125-02](validation_rules.md).

## Authorization
Matrix tests cover [PS-125-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault-injection and concurrency tests cover [PS-125-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Log-capture and rate-limit tests cover [PS-125-07](privacy_retention_abuse.md).

## Observability & budgets
Performance tests cover [PS-125-08](observability_performance.md).

## Tests
- TEST-PS-125-09-01 (contract): event and command schemas validate; schema drift fails CI.
- TEST-PS-125-09-02 (e2e): create → activate → update config → suspend → resume → offboard → delete, with audit trail.
- TEST-PS-125-09-03 (negative, cross-tenant): admin of A reads, updates, suspends and exports B; all return NOT_FOUND or FORBIDDEN.
- TEST-PS-125-09-04 (offline): client with queued tenant config edit receives EVT.REVISION_CONFLICT after suspension.
- TEST-PS-125-09-05 (a11y): tenant admin settings form has labelled fields and error text linked to inputs (Accessibility Lead checklist).

## Acceptance criteria
1. 100% of codes and matrix rows covered by tests.
2. Cross-tenant test suite passes with zero leaks.
3. Contract tests pass against CTR-EVT-001 and CTR-SCH-001 versions pinned in the release.

## Assumptions & open decisions
- ASSUMPTION: test fixtures use synthetic data only.
- PROVISIONAL (D08 default, unapproved): offline edit scenario uses local pending queue until relay acknowledgement.
