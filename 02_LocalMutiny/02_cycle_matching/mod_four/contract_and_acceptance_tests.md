# PS-017-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-09.R01 | Every requirement in PS-017-01 to -08 maps to a TEST-PS-017-* ID. | MVP |
| PS-017-09.R02 | Rotation and tie-break fixtures are shared with mod_n and run on every build. | MVP |
| PS-017-09.R03 | Contract tests against mod_lock and mod_feasibility fixtures. | MVP |

## Data / schema
Fixtures: four-cycles with all rotations; cycles with repeated listings; stale and fresh verdicts; value gaps at and above tolerance.

## Commands / queries / events
Harness uses PS-017-04 operations only.

## States & transitions
Each row of PS-017-03.

## Validation & errors
Each CYCFOUR code.

## Authorization
Each row of PS-017-05.

## Failure, idempotency, concurrency, offline
PS-017-06 tests.

## Privacy, retention, abuse
PS-017-07 tests.

## Observability & budgets
PS-017-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-017-01-01..03 | unit, property, contract | shape and rotation |
| TEST-PS-017-02-01..03 | unit, negative, boundary | validation |
| TEST-PS-017-03-01..03 | unit, property, integration | state machine |
| TEST-PS-017-04-01..03 | contract, unit, negative | commands |
| TEST-PS-017-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-017-06-01..03 | concurrency, integration, offline | races and recovery |
| TEST-PS-017-07-01..03 | privacy, abuse, integration | privacy and abuse |
| TEST-PS-017-08-01..03 | unit, load, negative | observability |
| TEST-PS-017-09-01 | e2e | four participants propose, all consent, lock receives cycle |
| TEST-PS-017-09-02 | e2e | one participant edits offer, all consents cleared, re-consent required |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Four-party e2e completes in 100% of fixtures.
3. Version-supersession test shows zero stale consents accepted.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- Dxx: D02 (deterministic matching), D04 (per-party consent), D08 (pending-ack); all PROVISIONAL.
