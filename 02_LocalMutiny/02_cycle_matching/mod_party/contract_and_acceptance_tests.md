# PS-019-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-09.R01 | Every requirement in PS-019-01 to -08 maps to a TEST-PS-019-* ID. | MVP |
| PS-019-09.R02 | Binding tests run for cycle lengths 3, 4 and N (≥ 5) using mod_three, mod_four and mod_n fixtures. | MVP |
| PS-019-09.R03 | Contract tests against F02.S01.M02 `par_` fixtures (identity owner). | MVP |

## Data / schema
Fixtures: participants in 0, 1 and 2 live cycles; cycles at each length; withdrawal after consent.

## Commands / queries / events
Harness uses PS-019-04 operations.

## States & transitions
Each row of PS-019-03.

## Validation & errors
Each CYCPARTY code.

## Authorization
Each row of PS-019-05.

## Failure, idempotency, concurrency, offline
PS-019-06 tests.

## Privacy, retention, abuse
PS-019-07 tests.

## Observability & budgets
PS-019-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-019-01-01..03 | unit, property, contract | binding shape and uniqueness |
| TEST-PS-019-02-01..03 | unit, negative, boundary | validation |
| TEST-PS-019-03-01..03 | unit, property, integration | states |
| TEST-PS-019-04-01..03 | contract, unit, negative | commands |
| TEST-PS-019-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-019-06-01..03 | concurrency, integration, offline | races |
| TEST-PS-019-07-01..03 | privacy, abuse, integration | privacy |
| TEST-PS-019-08-01..03 | unit, load, negative | observability |
| TEST-PS-019-09-01 | e2e | participant consents in cycle A, then cannot bind to cycle B |
| TEST-PS-019-09-02 | e2e | withdrawal before lock frees slot; another cycle binds same participant |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Double-booking never occurs in 100% of concurrency runs.
3. Withdrawal flows verified for all three cycle lengths.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
- Dxx: D04, D08 (PROVISIONAL).
