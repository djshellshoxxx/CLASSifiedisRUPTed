# PS-148-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-02.R01 | Any dimension cell with fewer than 10 underlying items (ASSUMPTION) is `suppressed` with value null. | MVP |
| PS-148-02.R02 | Suppression applies to complementary cells when a suppressed total could be derived by subtraction. | MVP |
| PS-148-02.R03 | A figure without a `source_job_id` or with a `methodology_version` not in the approved set is rejected. | MVP |
| PS-148-02.R04 | Dimension `region` accepts coarse codes only (D05 default). | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| TRANSP.SMALL_CELL_NOT_SUPPRESSED | false | unprocessable_state / 422 | err.transp.small_cell_not_suppressed | metric key |
| TRANSP.SOURCE_MISSING | false | precondition_failed / 412 | err.transp.source_missing | metric key |
| TRANSP.METHODOLOGY_UNAPPROVED | false | precondition_failed / 412 | err.transp.methodology_unapproved | version |
| TRANSP.REGION_PRECISION_FORBIDDEN | false | validation / 400 | err.transp.region_precision_forbidden | field name only |
| TRANSP.PUBLISHED_IMMUTABLE | false | conflict / 409 | err.transp.published_immutable | report_id |
| TRANSP.INVALID_TRANSITION | false | unprocessable_state / 422 | err.transp.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-148-02-01 (unit): each TRANSP code fires on its fixture.
- TEST-PS-148-02-02 (unit): a figure citing an unapproved methodology version is rejected.

## Acceptance criteria
1. TEST-PS-148-02-01, TEST-PS-148-02-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: small-cell threshold 10 is a default; Privacy Lead confirms.
- D05 (geoprivacy) governs region granularity: PROVISIONAL (D05 default, unapproved).
