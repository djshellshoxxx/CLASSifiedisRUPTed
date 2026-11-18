# PS-140-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-02.R01 | Every rejected write returns a CTR-ERR-001 envelope with a code from the table below. | MVP |
| PS-140-02.R02 | Validation runs before any write; a rejected write leaves zero rows changed. | MVP |
| PS-140-02.R03 | `details[].rule` uses the enum `REQUIRED`, `ENUM`, `PATTERN`, `REFERENCE`, `STATE`. Input values are never echoed. | MVP |
| PS-140-02.R04 | Fixture scan rejects any scenario whose `fixture_class` is not `synthetic` or whose payload contains an email, phone number, IP address or coordinate pattern. | MVP |

## Data / schema
Field rules are defined in [domain_schema](domain_schema.md). Validation adds cross-field checks: `expected_outcome = rejected_with_code` requires a non-empty `expected_code`; `attempt` must equal the highest stored attempt + 1 for the same `build_ref` and `scenario_key`.

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| OFFTEST.SCENARIO_DUPLICATE | false | conflict / 409 | err.offtest.scenario_duplicate | `scenario_key` collision |
| OFFTEST.FIXTURE_NOT_SYNTHETIC | false | validation / 400 | err.offtest.fixture_not_synthetic | `fixture_class` value rejected |
| OFFTEST.BUDGET_UNDEFINED | false | validation / 400 | err.offtest.budget_undefined | `budget_ref` not found |
| OFFTEST.BUILD_REF_INVALID | false | validation / 400 | err.offtest.build_ref_invalid | pattern failed |
| OFFTEST.ATTEMPT_OUT_OF_ORDER | false | conflict / 409 | err.offtest.attempt_out_of_order | expected attempt number |
| OFFTEST.INVALID_TRANSITION | false | unprocessable_state / 422 | err.offtest.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

Diagnostics exclude stack traces, file paths and fixture bodies (CTR-ERR-001 R06).

## Authorization
Validation runs after authorization. An unauthorized caller receives `SYS.FORBIDDEN` before any field is checked, so validation never reveals scenario existence.

## Assumptions and open decisions
- ASSUMPTION: the coordinate and email patterns used by the fixture scanner are maintained with the Privacy Lead.
- D07 (retention) affects only the retention fields, not validation: PROVISIONAL (D07 default, unapproved).
