# PS-123-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-02.R01 | Slug pattern and length per PS-123-01 R02. | MVP |
| PS-123-02.R02 | `title_key` must exist in the message catalog for every supported locale (F14 list, OPEN). | MVP |
| PS-123-02.R03 | `decision_refs` values must match `D01`–`D10` present in DECISIONS.md. | MVP |
| PS-123-02.R04 | A feature cannot be set `default_state = on` while any referenced decision is not APPROVED. | MVP |
| PS-123-02.R05 | `requires` entries must exist and be `active`; a dependency on a `retired` feature is refused. | MVP |

## Data / schema
Rules apply to the definition in PS-123-01.

## Commands / queries / events
Applied in `feature.define` and `feature.update` (PS-123-04).

## States & transitions
Failed validation creates no version.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FEATURE.DEFINITION_INVALID | false | validation / 400 | R01, R02, R03 |
| FEATURE.DECISION_NOT_APPROVED | false | unprocessable_state / 422 | R04 |
| FEATURE.DEPENDENCY_UNMET | false | unprocessable_state / 422 | R05 |
| FEATURE.CYCLE_DETECTED | false | unprocessable_state / 422 | acyclic check |
| FEATURE.SLUG_RETIRED | false | conflict / 409 | reuse attempt |

## Authorization
Validation does not authorize.

## Failure, idempotency, concurrency, offline
Deterministic; CI runs the same validation as the runtime.

## Privacy, retention, abuse
Errors name the field path only.

## Observability & budgets
Metric: `feature_definition_rejections_total{code}`.

## Tests
- TEST-PS-123-02-01 (unit): each rule R01–R05 pass and fail fixture.
- TEST-PS-123-02-02 (lint): decision IDs cross-checked with DECISIONS.md.
- TEST-PS-123-02-03 (negative): slug reuse after retirement refused.

## Acceptance criteria
1. Every code in the table is in the catalog.
2. TEST-PS-123-02-01 through -03 pass.

## Assumptions & open decisions
- PROVISIONAL (D01–D10 defaults): features depending on them ship off.
