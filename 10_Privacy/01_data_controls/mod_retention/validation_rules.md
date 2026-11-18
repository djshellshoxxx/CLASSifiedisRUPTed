# PS-079-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R07, HOLD_SCOPE_INVALID), CTR-SCH-001 (R10 data-class change review), CTR-CAP-001 (R06, R07), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-02.R01 | Unknown `retention_class` → `RETAIN.UNKNOWN_CLASS` (400). | MVP |
| PS-079-02.R02 | Hold without `cas_` scope, approval or end date → `PRV.HOLD_SCOPE_INVALID` (400), per CTR-PRV-001. | MVP |
| PS-079-02.R03 | Hold `ends_at` beyond 365 days from `applied_at` → `RETAIN.HOLD_TOO_LONG` (422). | MVP |
| PS-079-02.R04 | Lengthening a class maximum without F10 approval record → `RETAIN.POLICY_NOT_APPROVED` (422). | MVP |
| PS-079-02.R05 | Shortening a maximum requires a migration plan referencing affected record counts; missing plan → `RETAIN.POLICY_NOT_APPROVED` (422). | MVP |
| PS-079-02.R06 | Changing a field's data class without F10 review record → `SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW` (422) (CTR-SCH-001). | MVP |
| PS-079-02.R07 | Two approvers must be distinct and neither may be the requester → `CAP.SELF_APPROVAL_FORBIDDEN` (403) or `CAP.DUAL_APPROVAL_REQUIRED` (422). | MVP |

## Data / schema
Inputs: `retention_class` enum, `max_duration` ISO 8601 duration, `cas_` ID, `ends_at` timestamp, `approver_ids[2]`.

## Commands / queries / events
Applies to `retention.policy.publish`, `retention.hold.apply`, `retention.hold.release` (PS-079-04).

## States & transitions
Validation precedes transitions. Rejected input writes no row.

## Validation & errors
| Code | Retryable | Category / HTTP | Rule |
|---|---|---|---|
| RETAIN.UNKNOWN_CLASS | false | validation / 400 | R01 |
| RETAIN.HOLD_TOO_LONG | false | unprocessable_state / 422 | R03 |
| RETAIN.POLICY_NOT_APPROVED | false | unprocessable_state / 422 | R04, R05 |
| PRV.HOLD_SCOPE_INVALID | false | validation / 400 | R02 (contract code) |
| CAP.DUAL_APPROVAL_REQUIRED | false | unprocessable_state / 422 | R07 (contract code) |

## Authorization
Validation runs after authentication. Approval roles defined in PS-079-05.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Concurrent approvals of the same hold are serialised by `cas_` lock.

## Privacy, retention, abuse
Validation errors echo no values (CTR-ERR-001 R07). Hold reasons are coded enums, not free text.

## Observability & budgets
`retention_validation_rejections_total{rule}`.

## Tests
- TEST-PS-079-02-01 (unit): one positive and one negative case per rule R01–R07.
- TEST-PS-079-02-02 (security): hold with same operator as both approvers is rejected.

## Acceptance criteria
1. Codes match CTR-ERR-001 registry and retryable values.
2. No rejected publish or hold creates a row.
3. Self-approval negative test passes.

## Assumptions & open decisions
- ASSUMPTION: 365-day hold limit.
- OPEN (R07): jurisdiction review for legal periods.
- PROVISIONAL (D07 default).
