# PS-129-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-02.R01 | Reject any policy body with unknown fields (closed object). | MVP |
| PS-129-02.R02 | Reject `allowed_suites` referencing a suite not `active`, or a deprecated/retired suite in a new `active` policy. | MVP |
| PS-129-02.R03 | Reject `min_security_bits` below the registry floor (ASSUMPTION: 128). | MVP |
| PS-129-02.R04 | Reject `effective_from` earlier than submission time + 24 h (ASSUMPTION). | MVP |
| PS-129-02.R05 | Reject a policy whose key class already has an overlapping `active` or `scheduled` version. | MVP |
| PS-129-02.R06 | Reject any approval where approver = proposer, or the same approver appears twice. | MVP |

## Data / schema
Validation runs against the `crypto_policy` schema in [domain_schema.md](domain_schema.md). Diagnostics per CTR-ERR-001 R06: rule enum and field path only; submitted values are never echoed.

## Commands / queries / events
Applied on `crypto_policy.propose`, `crypto_policy.approve`, `crypto_policy.schedule`. See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Validation failure keeps the record in its prior state (no partial write).

## Validation & errors
| Code | Category | Retryable | message_key | Trigger (rule) |
|---|---|---|---|---|
| MGMT.POLICY_INVALID | validation (400) | false | err.mgmt.policy_invalid | R01, R03, R04; `details.rule` in {unknown_field, below_floor, too_soon, bad_range} |
| MGMT.SUITE_UNKNOWN | validation (400) | false | err.mgmt.suite_unknown | R02, suite not in registry |
| MGMT.ALGORITHM_DEPRECATED | unprocessable_state (422) | false | err.mgmt.algorithm_deprecated | R02, status deprecated or retired |
| MGMT.OVERLAP_CONFLICT | conflict (409) | false | err.mgmt.overlap_conflict | R05 |
| MGMT.DUAL_CONTROL_REQUIRED | precondition_failed (412) | false | err.mgmt.dual_control_required | R06, fewer than two distinct approvers at schedule |
| MGMT.SELF_APPROVAL_FORBIDDEN | forbidden (403) | false | err.mgmt.self_approval_forbidden | R06 (CAP.SELF_APPROVAL_FORBIDDEN mirrored) |

Shared codes (`EVT.REVISION_CONFLICT`, `SYS.NOT_FOUND`) are unchanged.

## Authorization
Validation runs after authentication and before any state read that could reveal existence of a non-visible policy (CTR-ERR-001 R08).

## Failure, idempotency, concurrency, offline
Validation is deterministic. Same input returns the same error code. Offline clients validate locally for display only; the server result is authoritative.

## Privacy, retention, abuse
Error responses contain no submitted values. Rejected drafts are retained 30 days for abuse analysis (ASSUMPTION), then deleted.

## Observability & budgets
Counter `mgmt_validation_fail_total{rule}`. Validation p95 ≤ 20 ms (ASSUMPTION).

## Tests
- TEST-PS-129-02-01: unit, one fixture per rule R01–R06.
- TEST-PS-129-02-02: contract, every code matches CTR-ERR-001 pattern and category-to-HTTP map.

## Acceptance criteria
1. Each rule has at least one failing and one passing fixture.
2. No error body contains submitted values or stack traces.
3. Codes are never reused (CTR-ERR-001 R09).

## Assumptions & open decisions
- ASSUMPTION: 24 h activation lead time and 128-bit floor.
- D10 default for rotation and approvals: PROVISIONAL (D10 default, unapproved).
