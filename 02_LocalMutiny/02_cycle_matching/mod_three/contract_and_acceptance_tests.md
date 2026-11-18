# PS-020-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-09.R01 | Every requirement in PS-020-01 to -08 maps to a TEST-PS-020-* ID. | MVP |
| PS-020-09.R02 | Rotation fixtures shared with mod_four run on every build. | MVP |
| PS-020-09.R03 | Contract tests against mod_feasibility and mod_lock fixtures. | MVP |

## Data / schema
Fixtures: all three rotations; listings locked elsewhere; stale and fresh verdicts; relevance perturbations.

## Commands / queries / events
PS-020-04 operations only.

## States & transitions
Every row of PS-020-03.

## Validation & errors
Every CYCTHREE code.

## Authorization
Every row of PS-020-05.

## Failure, idempotency, concurrency, offline
PS-020-06 tests.

## Privacy, retention, abuse
PS-020-07 tests.

## Observability & budgets
PS-020-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-020-01-01..03 | unit, property, contract | shape and rotation |
| TEST-PS-020-02-01..03 | unit, negative, property | validation and relevance |
| TEST-PS-020-03-01..03 | unit, property, integration | states |
| TEST-PS-020-04-01..03 | contract, unit, negative | commands |
| TEST-PS-020-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-020-06-01..03 | concurrency, integration | races and lock re-check |
| TEST-PS-020-07-01..03 | privacy, abuse, property | privacy |
| TEST-PS-020-08-01..03 | unit, load, negative | observability |
| TEST-PS-020-09-01 | e2e | three participants consent; lock receives cycle |
| TEST-PS-020-09-02 | e2e | one participant declines; all slots released; no lock |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Three-party e2e completes in 100% of fixtures.
3. Decline e2e leaves zero locked listings.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
- Dxx: D02, D04, D08 (PROVISIONAL).
