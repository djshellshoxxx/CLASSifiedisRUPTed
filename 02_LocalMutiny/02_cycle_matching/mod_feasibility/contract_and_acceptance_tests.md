# PS-016-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-09.R01 | Every requirement in PS-016-01 to -08 maps to a TEST-PS-016-* ID. | MVP |
| PS-016-09.R02 | Determinism is tested with shuffled inputs on every build. | MVP |
| PS-016-09.R03 | Contract tests run against consumer fixtures for mod_three, mod_four and mod_n. | MVP |

## Data / schema
Fixtures: 2-, 3-, 4-, 8-, and 9-participant candidates; 5,000 and 5,001 edge snapshots; expired and in-range quotes; coarse cells below and above K_MIN.

## Commands / queries / events
Harness uses evaluate and candidate_get only.

## States & transitions
Each row of PS-016-03 has a test.

## Validation & errors
Each FEASIBLE code has a negative test.

## Authorization
Each row of PS-016-05 has a test.

## Failure, idempotency, concurrency, offline
Determinism, budget and outage tests per PS-016-06.

## Privacy, retention, abuse
Lint and Sybil tests per PS-016-07.

## Observability & budgets
Latency and metric-name tests per PS-016-08.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-016-01-01..03 | unit, contract, lint | snapshot and schema |
| TEST-PS-016-02-01..03 | unit, property, negative | rules and codes |
| TEST-PS-016-03-01..03 | unit, property, integration | states |
| TEST-PS-016-04-01..03 | contract, unit, negative | commands and events |
| TEST-PS-016-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-016-06-01..03 | property, negative, integration | determinism and outage |
| TEST-PS-016-07-01..03 | privacy, abuse, integration | privacy and Sybil |
| TEST-PS-016-08-01..03 | load, unit, negative | budgets |
| TEST-PS-016-09-01 | e2e | candidate built, evaluated FEASIBLE, passed to mod_three fixture |
| TEST-PS-016-09-02 | e2e | candidate with stale availability evaluated INFEASIBLE, never consented |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Consumers receive only FEASIBLE candidates in 100% of runs.
3. Load test meets PS-016-08.R02 on the agreed profile.

## Assumptions & open decisions
- ASSUMPTION: fixtures are synthetic.
- Dxx: D02 (search), D03 (value tolerance), D05 (regions); all PROVISIONAL.
