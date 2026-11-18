# PS-126-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R06, R07), CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-02.R01 | Capability must be in the vocabulary; else `CAP.UNKNOWN_CAPABILITY` and the grant is not stored. | MVP |
| PS-126-02.R02 | Privileged grant (`mod`, `ope`, `sys` with case or global scope, or PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE access) requires `expires_at` ≤ `not_before` + 72 h. | MVP |
| PS-126-02.R03 | `case` scope requires `case_id` matching `^cas_`; `global` scope is refused for PRIVATE_PERSONAL, FINANCIAL_EVIDENCE and LOCATION_PRECISE. | MVP |
| PS-126-02.R04 | `constraints.purpose` must exist in the purpose registry (ASSUMPTION; F10 owns). | MVP |
| PS-126-02.R05 | `granted_by` and every approver must differ from `subject.ref`. | MVP |
| PS-126-02.R06 | A policy publication fails if any rule names an action not declared by its module (`AUTHZ.ACTION_NOT_DECLARED`). | MVP |
| PS-126-02.R07 | Rule sets are ≤ 2,000 rules and ≤ 256 KiB. | MVP |

## Data / schema
Grant schema is CTR-CAP-001. Validation adds the purpose registry lookup and action declaration lookup.

## Commands / queries / events
Applies to `grant.create`, `grant.approve` and `policy.publish` in [PS-126-04](commands_queries_events.md).

## States & transitions
Validation runs before any transition in [PS-126-03](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP | Trigger |
|---|---|---|---|
| CAP.UNKNOWN_CAPABILITY | false | validation / 400 | R01 |
| CAP.EXPIRY_REQUIRED | false | validation / 400 | R02 |
| CAP.SCOPE_INVALID | false | validation / 400 | R03 |
| CAP.DUAL_APPROVAL_REQUIRED | false | unprocessable_state / 422 | Missing second approver |
| CAP.SELF_APPROVAL_FORBIDDEN | false | forbidden / 403 | R05 |
| AUTHZ.PURPOSE_UNKNOWN | false | validation / 400 | R04 |
| AUTHZ.ACTION_NOT_DECLARED | false | validation / 400 | R06 |
| AUTHZ.RULESET_TOO_LARGE | false | validation / 400 | R07 |

## Authorization
Validation runs for all callers; only `ope` with `grt.administer` or `pol.administer` may trigger the commands.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Purpose registry and action declarations are read at a pinned version recorded with the grant.

## Privacy, retention, abuse
Error details contain field paths only, never grant purposes that name individuals (CTR-ERR-001 R06).

## Observability & budgets
`authz_validation_failures_total{code}`.

## Tests
- TEST-PS-126-02-01 (unit): each rule R01–R07 has a passing and a failing fixture.
- TEST-PS-126-02-02 (negative): 73-hour privileged grant is refused with `CAP.EXPIRY_REQUIRED`.
- TEST-PS-126-02-03 (negative): policy naming an undeclared action fails publication.

## Acceptance criteria
1. Each code is returned for its trigger only.
2. No privileged grant is stored without expiry, purpose and approvals.
3. Ruleset size limit enforced before parsing.

## Assumptions & open decisions
- ASSUMPTION: 72-hour privileged grant cap and 2,000-rule limit.
- PROVISIONAL (D05 default, unapproved): precise-location grants are object-scoped only.
