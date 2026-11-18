# PS-025-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02–R04, R15), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-09.R01 | Every requirement in PS-025-01 to -08 maps to a TEST-PS-025-* ID. | MVP |
| PS-025-09.R02 | Contract tests run against the F09.S03.M01 quote fixtures. | MVP |
| PS-025-09.R03 | Golden rounding fixtures are shared with F09.S03.M03 precision tests. | MVP |

## Data / schema
Fixtures: fiat-to-fiat, fiat-to-asset, asset-to-asset pairs; quotes at and past expiry; exponents 0, 2, 8; forbidden label terms.

## Commands / queries / events
PS-025-04 operations only.

## States & transitions
Each row of PS-025-03.

## Validation & errors
Each CYCCURR code.

## Authorization
Each row of PS-025-05.

## Failure, idempotency, concurrency, offline
PS-025-06 tests.

## Privacy, retention, abuse
PS-025-07 tests.

## Observability & budgets
PS-025-08 tests.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-025-01-01..03 | unit, contract, lint | schema |
| TEST-PS-025-02-01..03 | unit, boundary, lint | validation |
| TEST-PS-025-03-01..03 | unit, integration, property | states |
| TEST-PS-025-04-01..03 | contract, unit, negative | commands |
| TEST-PS-025-05-01..03 | unit, negative, integration | authorization |
| TEST-PS-025-06-01..03 | property, integration, fault | rounding and failure |
| TEST-PS-025-07-01..03 | privacy, label, retention | privacy |
| TEST-PS-025-08-01..03 | unit, load, negative | observability |
| TEST-PS-025-09-01 | e2e | cross-currency cycle, quote pinned, consent, lock |
| TEST-PS-025-09-02 | e2e | quote expires before lock; refresh; re-consent |

## Acceptance criteria
1. All TEST IDs pass in CI before merge (at implementation).
2. No float appears in any stored or displayed value path (lint).
3. Expiry e2e shows no lock on stale terms in 100% of runs.

## Assumptions & open decisions
- ASSUMPTION: synthetic quote fixtures; no live rates in tests.
- Dxx: D03 (primary), D06 (receipts), D08 (pending-ack); PROVISIONAL.
