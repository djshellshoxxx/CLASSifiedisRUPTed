# PS-129-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-05.R01 | Policy writes require `ope` principal with `administer` at `global` scope. | MVP |
| PS-129-05.R02 | Approval requires two distinct `ope` principals; neither may be the proposer. | MVP |
| PS-129-05.R03 | Scheduler activation requires `sys_` principal with `execute` scoped to `crypto_policy` only. | MVP |
| PS-129-05.R04 | Privileged grants for this module carry `purpose` and `expires_at` ≤ 72 h after `not_before` (CTR-CAP-001 R06). | MVP |
| PS-129-05.R05 | `mod_` principals have no access to policy writes. | MVP |

## Data / schema
Capability IDs use `<resource_type>.<verb>` (CTR-CAP-001 R03). Grants are stored in `grt_` records (CTR-ID-001 prefix owned by F16).

## Commands / queries / events
Authorization is checked before command validation.

## States & transitions
Revocation of an `ope` grant takes effect at next decision (CTR-CAP-001 R09, zero cache for writes).

## Validation & errors
| Actor | Action | Resource | Scope | Result |
|---|---|---|---|---|
| ope | crypto_policy.propose | policy | global | allow |
| ope (not proposer) | crypto_policy.approve | policy | global | allow once per approver |
| ope (proposer) | crypto_policy.approve | policy | global | DENY, MGMT.SELF_APPROVAL_FORBIDDEN |
| sys | crypto_policy.execute (activate) | policy | global | allow |
| any | crypto_policy.read | policy | global | allow (PUBLIC) |
| mod | any write | policy | any | DENY, SYS.NOT_FOUND-equivalent for read-hidden paths |
| user | any write | policy | any | DENY, SYS.FORBIDDEN |

## Authorization
Capability IDs: `crypto_policy.propose`, `crypto_policy.accept`, `crypto_policy.execute`, `crypto_policy.administer`, `crypto_policy.read`.

## Failure, idempotency, concurrency, offline
Decision records (`dec_`) are written for each denied write. Cached decisions are not used for writes.

## Privacy, retention, abuse
Decision records hold no content, only IDs and rule names. Retained per CTR-PRV-001 audit class.

## Observability & budgets
Counter `crypto_policy_authz_denied_total{rule}`; alert on more than 10 denials per hour from one `ope`.

## Tests
- TEST-PS-129-05-01: unit, every row of the decision table.
- TEST-PS-129-05-02: negative, self-approval and expired-grant attempts denied.

## Acceptance criteria
1. Default deny holds for every undeclared actor/action pair.
2. Self-approval is denied with `CAP.SELF_APPROVAL_FORBIDDEN` mapping.
3. Each privileged decision emits one `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: dual control applies to all policy approvals.
- D10 default for administrative recovery: PROVISIONAL (D10 default, unapproved).
