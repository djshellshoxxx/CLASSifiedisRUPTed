# PS-133-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-02.R01 | threat_id matches `^THR-[A-Z]{2,8}-\d{3}$`; reject otherwise | MVP |
| PS-133-02.R02 | framework and category pair must match the enum sets in PS-133-01 | MVP |
| PS-133-02.R03 | description and title contain no `http(s)://` strings and no fenced code blocks (0 matches allowed) | MVP |
| PS-133-02.R04 | Residual acceptance rejected when accepted_by_role == approved_by_role | MVP |
| PS-133-02.R05 | Control links must resolve to an existing module path or CTR file at publish | MVP |

## Data / schema
Validates `Threat`, `ControlLink`, `ResidualAcceptance` from PS-133-01.

## Commands / queries / events
Validation runs inside all write commands in PS-133-04. `threats.CheckModel` runs the full set read-only.

## States & transitions
Not applicable; validation is stateless.

## Validation & errors
| Code | Trigger | Retryable | User message key | Diagnostic |
|---|---|---|---|---|
| THREATS.THREAT_ID_INVALID | regex fails | no | threats.id_invalid | pattern only |
| THREATS.FRAMEWORK_CATEGORY_MISMATCH | pair not allowed | no | threats.category_mismatch | framework name |
| THREATS.RATING_OUT_OF_RANGE | likelihood or impact outside 1..5 | no | threats.rating_range | field name |
| THREATS.DESCRIPTION_UNSAFE | URL or code block found | no | threats.description_unsafe | rule ID, no matched text |
| THREATS.CONTROL_REF_UNRESOLVED | target missing | no | threats.control_unresolved | target path only |
| THREATS.RESIDUAL_SELF_APPROVED | same role twice | no | threats.self_approved | role name |
| THREATS.REVIEW_OVERDUE | review_due passed | warning, not error | threats.review_overdue | threat_id |

## Authorization
Validators run with server identity; rule set versioned with schema.

## Failure, idempotency, concurrency, offline
Deterministic: same input gives same error list, sorted by field name. No side effects.

## Privacy, retention, abuse
Diagnostics never echo description text (it may contain sensitive attack paths).

## Observability & budgets
Counter per code per day. Check of full register p95 <= 10 s for 500 threats (ASSUMPTION).

## Tests
- TEST-PS-133-02-01 (unit): each error code triggered by minimal fixture.
- TEST-PS-133-02-02 (property): generated descriptions containing "http://" fragments are always rejected.
- TEST-PS-133-02-03 (unit): accepted_by == approved_by rejected.

## Acceptance criteria
1. All seven codes have one unit test each.
2. No diagnostic contains description text (grep test on error output).
3. Dangling control detection fires on publish, not only nightly.

## Assumptions & open decisions
- ASSUMPTION: URL detection is a heuristic; analysts may still paste indirect references. Human review remains required.
- D06 is not applicable (no receipts here).
