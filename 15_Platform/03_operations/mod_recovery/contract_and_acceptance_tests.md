# PS-122-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-09.R01 | Contract tests with PS-120 (backup manifest and tombstone formats) run on every manifest version. | MVP |
| PS-122-09.R02 | Contract tests with consumers F02.S03.M04 (cycle recovery), F11.S03.M03 (federation migration) and F17.S02.M02 (chaos) confirm their post-restore expectations. | MVP |
| PS-122-09.R03 | Drill runs in staging with synthetic data and recorded results. | MVP |

## Data / schema
Fixtures: `fixtures/recovery/<scenario>/` with expected step sequence and digests.

## Commands / queries / events
Tests use PS-122-04 commands only.

## States & transitions
Every PS-122-03 transition covered.

## Validation & errors
Every code in PS-122-02 and PS-122-06 covered.

## Authorization
Negative tests for PS-122-05 matrix.

## Failure, idempotency, concurrency, offline
Fault injection at each step.

## Privacy, retention, abuse
Synthetic data only.

## Observability & budgets
Drill suite <= 6 h in staging (ASSUMPTION).

## Tests
- TEST-PS-122-09-01 (contract): manifest v1.x restore path passes.
- TEST-PS-122-09-02 (contract): cycle recovery and federation resync expectations pass.
- TEST-PS-122-09-03 (e2e): full drill in staging meets R03 of PS-122-08.
- TEST-PS-122-09-04 (lint): fixtures synthetic.

## Acceptance criteria
1. Staging drill passes with recorded RTO and RPO.
2. TEST-PS-122-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F17): staging environment ownership for drills.
