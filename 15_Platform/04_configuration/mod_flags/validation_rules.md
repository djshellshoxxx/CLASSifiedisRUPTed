# PS-124-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-02.R01 | `key` matches `^[a-z][a-z0-9_]{2,63}$` and is unique; retired keys are not reused. | MVP |
| PS-124-02.R02 | `default_value` type matches `type`; for flags whose feature has any OPEN decision, `default_value` must be the off value. | MVP |
| PS-124-02.R03 | Variant weights sum to 10000 exactly. | MVP |
| PS-124-02.R04 | Targeting attributes must be in the allow-list (PS-124-07 R03); others refused with `FLAG.FORBIDDEN_ATTRIBUTE`. | MVP |
| PS-124-02.R05 | Rollout increase from 0 to above 0 for a gated feature requires a `change_ref` and second approver (PS-124-05). | MVP |
| PS-124-02.R06 | Rollout percentage greater than 0 on a feature not `active` is refused. | MVP |

## Data / schema
Rules apply to the definition in PS-124-01.

## Commands / queries / events
Applied in `flag.create` and `flag.update` (PS-124-04).

## States & transitions
Validation failure creates no revision.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FLAG.DEFINITION_INVALID | false | validation / 400 | R01, R02, R03 |
| FLAG.FORBIDDEN_ATTRIBUTE | false | validation / 400 | R04 |
| FLAG.APPROVAL_MISSING | false | unprocessable_state / 422 | R05 |
| FLAG.FEATURE_NOT_ACTIVE | false | unprocessable_state / 422 | R06 |
| FLAG.ROLLOUT_INVALID | false | validation / 400 | rollout outside 0–10000 |

## Authorization
Validation runs before approval checks; denial recorded (CTR-CAP-001).

## Failure, idempotency, concurrency, offline
Deterministic. Same validation runs in CI and at runtime.

## Privacy, retention, abuse
Error bodies never echo targeting values (CTR-ERR-001 R07).

## Observability & budgets
Metric: `flag_validation_rejections_total{code}`.

## Tests
- TEST-PS-124-02-01 (unit): each rule pass and fail fixture.
- TEST-PS-124-02-02 (negative): targeting by a location attribute refused.
- TEST-PS-124-02-03 (negative): rollout up without approver refused.
- TEST-PS-124-02-04 (lint): default value safe-off for every flag on an OPEN-decision feature.

## Acceptance criteria
1. Every code in the table is in the catalog.
2. TEST-PS-124-02-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D01–D10 defaults; features default off).
