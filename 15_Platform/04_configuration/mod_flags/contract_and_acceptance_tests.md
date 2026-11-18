# PS-124-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-09.R01 | Client SDK contract tests for `flag.evaluate` run against every supported response version (CTR-SCH-001 R09). | MVP |
| PS-124-09.R02 | Each consuming module has a test showing its gated path is off when the flag is default. | MVP |
| PS-124-09.R03 | Synthetic subjects and attributes only. | MVP |

## Data / schema
Fixtures: `fixtures/flags/<key>/<version>.json`.

## Commands / queries / events
Tests use PS-124-04 operations.

## States & transitions
Every PS-124-03 transition covered.

## Validation & errors
Every code in PS-124-02 and PS-124-06 covered.

## Authorization
PS-124-05 matrix tested.

## Failure, idempotency, concurrency, offline
Fault cases in PS-124-06.

## Privacy, retention, abuse
Fixture scan.

## Observability & budgets
Suite <= 15 min (ASSUMPTION).

## Tests
- TEST-PS-124-09-01 (contract): SDK response shape.
- TEST-PS-124-09-02 (integration): each consumer gated path off by default.
- TEST-PS-124-09-03 (coverage): transitions and codes.
- TEST-PS-124-09-04 (lint): fixtures synthetic.

## Acceptance criteria
1. Every gated consumer passes TEST-02.
2. TEST-PS-124-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F17): owner of SDK contract tests.
