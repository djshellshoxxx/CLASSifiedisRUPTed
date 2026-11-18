# PS-138-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-02.R01 | Reject `fault_type` outside the closed enum. | MVP |
| PS-138-02.R02 | Reject `blast_radius` = `production` or any target resolving to a production host. | MVP |
| PS-138-02.R03 | Reject `max_duration_s` above 1,800. | MVP |
| PS-138-02.R04 | Reject experiments without a numeric abort condition. | MVP |
| PS-138-02.R05 | Reject `hypothesis` longer than 500 characters or containing personal-data patterns. | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applied on `chaos.propose` and `chaos.start`.

## States & transitions
Validation failure creates no experiment.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| CHAOS.FAULT_TYPE_INVALID | validation (400) | false | err.chaos.fault_type_invalid |
| CHAOS.PRODUCTION_TARGET_FORBIDDEN | forbidden (403) | false | err.chaos.production_target_forbidden |
| CHAOS.DURATION_EXCEEDED | validation (400) | false | err.chaos.duration_exceeded |
| CHAOS.ABORT_CONDITION_MISSING | validation (400) | false | err.chaos.abort_condition_missing |
| CHAOS.CONCURRENCY_LIMIT | conflict (409) | true | err.chaos.concurrency_limit |

## Authorization
Validation after authentication.

## Failure, idempotency, concurrency, offline
Concurrency limit errors are retryable after a running experiment ends.

## Privacy, retention, abuse
Error output contains no target hostnames.

## Observability & budgets
Counter `chaos_validation_fail_total{rule}`.

## Tests
- TEST-PS-138-02-01: unit, one fixture per rule.
- TEST-PS-138-02-02: negative, production hostname target rejected.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. Zero production targets accepted.

## Assumptions & open decisions
- ASSUMPTION: concurrency limit 2.
- D05: not applicable at MVP (no location hypotheses in the MVP experiment set).
