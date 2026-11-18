# PS-132-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-02.R01 | Reject `action_type` outside the closed enum. | MVP |
| PS-132-02.R02 | Reject `platform_wide` blast radius unless `approvers` has two distinct entries. | MVP |
| PS-132-02.R03 | Reject `rollback_plan` missing or longer than 1,000 characters. | MVP |
| PS-132-02.R04 | Reject `target_ref` whose prefix does not match `action_type` (for example `key_` for `session_revoke_scope`). | MVP |
| PS-132-02.R05 | Reject actions on SEV1–SEV2 incidents with `incident_id` missing. | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `response.propose`, `response.approve`, `response.execute`.

## States & transitions
Validation failure creates no record.

## Validation & errors
| Code | Category | Retryable | message_key | Rule |
|---|---|---|---|---|
| RESPONSE.ACTION_TYPE_INVALID | validation (400) | false | err.response.action_type_invalid | R01 |
| RESPONSE.TWO_APPROVERS_REQUIRED | precondition_failed (412) | false | err.response.two_approvers_required | R02 |
| RESPONSE.ROLLBACK_PLAN_INVALID | validation (400) | false | err.response.rollback_plan_invalid | R03 |
| RESPONSE.TARGET_MISMATCH | validation (400) | false | err.response.target_mismatch | R04 |
| RESPONSE.INCIDENT_REQUIRED | precondition_failed (412) | false | err.response.incident_required | R05 |

## Authorization
Validation runs after authentication (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Deterministic. Same request gives same code.

## Privacy, retention, abuse
Errors never echo `target_ref` values beyond the request ID.

## Observability & budgets
Counter `response_validation_fail_total{rule}`.

## Tests
- TEST-PS-132-02-01: unit, one fixture per rule.
- TEST-PS-132-02-02: negative, platform-wide flag with one approver rejected.

## Acceptance criteria
1. Each rule has failing and passing fixtures.
2. No platform-wide action passes with fewer than two approvers.

## Assumptions & open decisions
- ASSUMPTION: 1,000-character limit.
- D01 (peer quarantine as action): PROVISIONAL (D01 default, unapproved).
