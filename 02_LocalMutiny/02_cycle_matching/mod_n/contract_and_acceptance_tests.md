# PS-018-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-09.R01 | Every requirement in PS-018-01 to -08 maps to a TEST-PS-018-* ID. | MVP |
| PS-018-09.R02 | Golden fixtures for lengths 5, 6, 7 and 8, plus mod_four shadow comparison at length 4 (routing check). | MVP |
| PS-018-09.R03 | Contract tests against mod_feasibility snapshot fixtures. | MVP |

## Data / schema
Fixtures: complete directed graphs of 5–8 nodes; sparse graphs with no cycles; crafted budget-breaking graphs; 5,000-edge snapshot.

## Commands / queries / events
Harness uses PS-018-04 operations only.

## States & transitions
Each row of PS-018-03.

## Validation & errors
Each CYCLEN code.

## Authorization
Each row of PS-018-05.

## Failure, idempotency, concurrency, offline
PS-018-06 tests.

## Privacy, retention, abuse
PS-018-07 tests.

## Observability & budgets
PS-018-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-018-01-01..03 | unit, contract | ordering and routing |
| TEST-PS-018-02-01..03 | unit, boundary, negative | validation |
| TEST-PS-018-03-01..03 | unit, property, integration | states |
| TEST-PS-018-04-01..03 | contract, unit, negative | commands |
| TEST-PS-018-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-018-06-01..03 | negative, property, integration | budget and recovery |
| TEST-PS-018-07-01..03 | privacy, abuse, integration | privacy and abuse |
| TEST-PS-018-08-01..03 | unit, load, negative | observability |
| TEST-PS-018-09-01 | e2e | 6-party cycle found, all consent, lock receives it |
| TEST-PS-018-09-02 | e2e | budget-breaking graph yields no proposals and a completed-empty run |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Golden fixtures produce identical ordered output across releases.
3. No length-2 to length-4 cycle is produced by mod_n in 100% of runs.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- Dxx: D02 (search), D07 (retention); PROVISIONAL.
