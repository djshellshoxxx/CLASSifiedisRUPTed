# PS-046-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (fixtures), CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

**Decision labels:** No fairness guarantee is claimed; tests check configured constraints only.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-09.R01 | Contract tests for `rank_policy` and `exposure_audit` schema versions. | MVP |
| PS-046-09.R02 | One test per `FAIRNESS.*` code. | MVP |
| PS-046-09.R03 | Golden fixtures for re-rank outputs. | MVP |
| PS-046-09.R04 | End-to-end: draft → two approvals → activate → apply to pages → audit summary. | MVP |
| PS-046-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: synthetic candidate lists with seller buckets and promoted flags.

## Commands / queries / events
Envelope tests for `rank_policy.*`.

## States & transitions
One case per PS-046-03 row.

## Validation & errors
One case per PS-046-02 rule.

## Authorization
One case per PS-046-05 row.

## Failure, idempotency, concurrency, offline
PS-046-06 cases included.

## Privacy, retention, abuse
PS-046-07 tests included.

## Observability & budgets
PS-046-08 metric presence test included.

## Tests
- TEST-PS-046-09-01 (contract): schema round-trip.
- TEST-PS-046-09-02 (error table): one case per `FAIRNESS.*` code.
- TEST-PS-046-09-03 (e2e): R04 flow completes; audit summary shows caps respected.
- TEST-PS-046-09-04 (negative e2e): 21% promoted share config rejected.

## Acceptance criteria
1. TEST-PS-046-09-01 through -04 pass in CI.
2. Every requirement in PS-046-01 through -08 maps to a test ID.
3. Fixtures synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
- PENDING CTR-SCH-001 registration.
