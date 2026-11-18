# PS-126-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead; test ownership QA Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action matrix and tests 01–07), CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-09.R01 | Every row of the CTR-CAP-001 action matrix has an executable test. | MVP |
| PS-126-09.R02 | S3-02 negative suite (cross-user IDs, changed participant lists, stale roles, revoked membership, guessed IDs, bulk endpoints, alternate paths) runs on every release gate. | MVP |
| PS-126-09.R03 | Zero ALLOW in the default-deny suite across all registered actions. | MVP |
| PS-126-09.R04 | Every module authorization matrix is parsed and tested against the policy bundle. | MVP |

## Data / schema
Fixtures: two participants in a proposal, one non-participant, one moderator with and without case grant, one ope pair, one support operator, one quarantined federated peer, one revoked grant.

## Commands / queries / events
Contract tests exercise [PS-126-04](commands_queries_events.md) through the public API.

## States & transitions
Covered by [PS-126-03](workflow_state_machine.md) tests.

## Validation & errors
Covered by [PS-126-02](validation_rules.md) tests.

## Authorization
Matrix tests from [PS-126-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Covered by [PS-126-06](failure_recovery_idempotency.md) tests.

## Privacy, retention, abuse
Covered by [PS-126-07](privacy_retention_abuse.md) tests.

## Observability & budgets
Covered by [PS-126-08](observability_performance.md) tests.

## Tests
- TEST-PS-126-09-01 (unit): default deny for every action in the vocabulary with no relation and no grant.
- TEST-PS-126-09-02 (matrix): all CTR-CAP-001 matrix rows.
- TEST-PS-126-09-03 (negative integration, S3-02): cross-user IDs, bulk endpoints and alternate API paths deny identically.
- TEST-PS-126-09-04 (property): for random principal, action and resource, decision equals the model in the policy spec.
- TEST-PS-126-09-05 (privileged): privileged grant without expiry, approvals or with self-approval is refused.
- TEST-PS-126-09-06 (revocation): revoke then decide within 60 s → DENY.
- TEST-PS-126-09-07 (peer): quarantined peer denied on every import path; restored only with a new grant.

## Acceptance criteria
1. 100% of matrix rows pass.
2. S3-02 negative suite passes with zero leaks.
3. Property test runs ≥ 10,000 cases with zero divergence.

## Assumptions & open decisions
- ASSUMPTION: model in the policy spec is the oracle for property tests.
- PROVISIONAL (D04 default, unapproved): partial barter authorization tests follow explicit per-party attestations.
