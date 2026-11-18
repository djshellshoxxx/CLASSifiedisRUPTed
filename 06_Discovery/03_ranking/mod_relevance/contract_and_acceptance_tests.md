# PS-047-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (fixtures), CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

**Decision labels:** No ranking quality claim; tests check determinism and constraints.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-09.R01 | Contract tests for `ranking_model` and ranking output schemas. | MVP |
| PS-047-09.R02 | One test per `RELEV.*` code. | MVP |
| PS-047-09.R03 | Golden fixtures for score vectors per model version. | MVP |
| PS-047-09.R04 | End-to-end: draft → shadow → two approvals → activate → rank page with reason codes. | MVP |
| PS-047-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: synthetic candidates with text scores, cell hops, quality and bands.

## Commands / queries / events
Envelope tests for `ranking_model.*`.

## States & transitions
One case per PS-047-03 row.

## Validation & errors
One case per PS-047-02 rule.

## Authorization
One case per PS-047-05 row.

## Failure, idempotency, concurrency, offline
PS-047-06 cases included.

## Privacy, retention, abuse
PS-047-07 tests included.

## Observability & budgets
PS-047-08 metric presence test included.

## Tests
- TEST-PS-047-09-01 (contract): schema round-trip.
- TEST-PS-047-09-02 (error table): one case per `RELEV.*` code.
- TEST-PS-047-09-03 (e2e): R04 flow completes; every result has ≤ 3 reasons.
- TEST-PS-047-09-04 (negative e2e): model with a `lat` feature never reaches shadow.

## Acceptance criteria
1. TEST-PS-047-09-01 through -04 pass in CI.
2. Every requirement in PS-047-01 through -08 maps to a test ID.
3. Fixtures synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
- PENDING CTR-SCH-001 registration.
