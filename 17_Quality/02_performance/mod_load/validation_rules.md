# PS-139-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-02.R01 | Reject weights not summing to 1.000000 ± 0.000001. | MVP |
| PS-139-02.R02 | Reject an operation ID not registered in the command/query catalog. | MVP |
| PS-139-02.R03 | Reject a profile with target RPS above the approved environment ceiling (ASSUMPTION: 2,000 rps staging). | MVP |
| PS-139-02.R04 | Reject a run against a production host. | MVP |
| PS-139-02.R05 | Reject a population size above 100,000 synthetic accounts (ASSUMPTION). | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applied on `load.define_workload`, `load.define_profile`, `load.run`.

## States & transitions
Validation failure creates no record.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| LOAD.WEIGHTS_INVALID | validation (400) | false | err.load.weights_invalid |
| LOAD.OPERATION_UNKNOWN | validation (400) | false | err.load.operation_unknown |
| LOAD.RATE_ABOVE_CEILING | validation (400) | false | err.load.rate_above_ceiling |
| LOAD.PRODUCTION_TARGET_FORBIDDEN | forbidden (403) | false | err.load.production_target_forbidden |
| LOAD.POPULATION_TOO_LARGE | validation (400) | false | err.load.population_too_large |

## Authorization
Validation after authentication.

## Failure, idempotency, concurrency, offline
Deterministic for the same input.

## Privacy, retention, abuse
Error output contains no hostnames.

## Observability & budgets
Counter `load_validation_fail_total{rule}`.

## Tests
- TEST-PS-139-02-01: unit, one fixture per rule.
- TEST-PS-139-02-02: negative, production host rejected.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. No run starts above the rate ceiling.

## Assumptions & open decisions
- ASSUMPTION: 2,000 rps staging ceiling and 100,000 population cap.
- D05 (geo query load): PROVISIONAL (D05 default, unapproved).
