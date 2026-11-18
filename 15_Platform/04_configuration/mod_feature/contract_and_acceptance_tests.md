# PS-123-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-09.R01 | Every feature with `owner_module` has a contract check that its module declares the feature slug in its own spec. | MVP |
| PS-123-09.R02 | Schema tests for the definition format run against CTR-SCH-001 registry. | MVP |
| PS-123-09.R03 | Synthetic data only. | MVP |

## Data / schema
Fixtures: `fixtures/features/<slug>.json`.

## Commands / queries / events
Tests use PS-123-04 commands.

## States & transitions
Every PS-123-03 transition covered.

## Validation & errors
Every code in PS-123-02 and PS-123-06 covered.

## Authorization
Negative tests for PS-123-05 covered.

## Failure, idempotency, concurrency, offline
Fault cases in PS-123-06.

## Privacy, retention, abuse
Fixture scan.

## Observability & budgets
Suite <= 10 min (ASSUMPTION).

## Tests
- TEST-PS-123-09-01 (contract): owner module declares slug.
- TEST-PS-123-09-02 (schema): definition format passes registry check.
- TEST-PS-123-09-03 (coverage): transitions and codes covered.
- TEST-PS-123-09-04 (lint): fixtures synthetic.

## Acceptance criteria
1. Every active feature passes TEST-01.
2. TEST-PS-123-09-01 through -04 pass.

## Assumptions & open decisions
- OPEN (F17): test ownership for feature catalog.
