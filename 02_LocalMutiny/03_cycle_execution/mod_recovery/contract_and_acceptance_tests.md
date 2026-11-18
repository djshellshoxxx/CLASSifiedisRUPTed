# PS-024-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-COM-001 (R14), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-09.R01 | Every requirement in PS-024-01 to -08 maps to a TEST-PS-024-* ID. | MVP |
| PS-024-09.R02 | Signature tests use fixed test keys and the reviewed library's vectors. | MVP |
| PS-024-09.R03 | Contract tests against mod_dropouts and mod_lock fixtures. | MVP |

## Data / schema
Fixtures: 3-, 4- and N-party cycles locked; dropout before attest; disagreement; late attest; forged signature.

## Commands / queries / events
PS-024-04 operations only.

## States & transitions
Every row of PS-024-03.

## Validation & errors
Each CYCRECOV code.

## Authorization
Each row of PS-024-05.

## Failure, idempotency, concurrency, offline
PS-024-06 tests.

## Privacy, retention, abuse
PS-024-07 tests.

## Observability & budgets
PS-024-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-024-01-01..03 | unit, contract, property | record shape |
| TEST-PS-024-02-01..03 | unit, negative, security | validation and signatures |
| TEST-PS-024-03-01..03 | unit, property, integration | states |
| TEST-PS-024-04-01..03 | contract, unit, negative | commands |
| TEST-PS-024-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-024-06-01..03 | integration, negative, fault | failure paths |
| TEST-PS-024-07-01..03 | privacy, retention, abuse | privacy |
| TEST-PS-024-08-01..03 | unit, load, negative | observability |
| TEST-PS-024-09-01 | e2e | 3-party cycle; one party drops; attestations; compensation closes complete |
| TEST-PS-024-09-02 | e2e | 4-party disagreement; escalated; no compensation until case decision |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. Dropout e2e produces released listings in 100% of runs.
3. Disagreement e2e produces no automatic compensation.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures and test keys only.
- Dxx: D04, D06, D07 (PROVISIONAL).
