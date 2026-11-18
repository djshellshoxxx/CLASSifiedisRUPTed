# PS-121-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-09.R01 | Every emitter module's log and metric output is validated against this module's schemas in its CI (CTR-SCH-001 R09). | MVP |
| PS-121-09.R02 | Error-code coverage test: every CTR-ERR-001 code emitted by any module maps to a log field permitted by PS-121-01. | MVP |
| PS-121-09.R03 | Synthetic fixtures only; no real records. | MVP |

## Data / schema
Fixtures: `fixtures/telemetry/<record_type>/<version>/`.

## Commands / queries / events
Tests use `telemetry.ingest` and `alert.*` commands only.

## States & transitions
Every PS-121-03 transition has a test.

## Validation & errors
Each code in PS-121-02 and PS-121-06 has a fixture.

## Authorization
Negative tests for PS-121-05 matrix included.

## Failure, idempotency, concurrency, offline
Fault injection suite from PS-121-06 in staging.

## Privacy, retention, abuse
Fixture scan for identifiers before test run.

## Observability & budgets
Suite <= 20 min in CI (ASSUMPTION).

## Tests
- TEST-PS-121-09-01 (contract): every module emitter passes schema check.
- TEST-PS-121-09-02 (coverage): code-to-field mapping complete.
- TEST-PS-121-09-03 (lint): fixtures contain no real data.
- TEST-PS-121-09-04 (e2e): induced alert reaches `firing` and `resolved` in staging.

## Acceptance criteria
1. All emitters pass TEST-01.
2. TEST-PS-121-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN: owner of emitter contract tests (F17 QA Lead).
