# PS-132-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-05.R01 | Proposing an action requires `ope` with `execute` on `containment_action` for the incident case. | MVP |
| PS-132-05.R02 | Approving requires two distinct `ope` responders; `platform_wide` requires a Security Lead as one approver. | MVP |
| PS-132-05.R03 | Executing requires `sys_` with capability bound to the `action_type` and a live approval set. | MVP |
| PS-132-05.R04 | No principal may approve its own proposal (`CAP.SELF_APPROVAL_FORBIDDEN`). | MVP |
| PS-132-05.R05 | `mod_` principals may propose `peer_quarantine` only for `fpr_` targets in their case. | MVP |

## Data / schema
Capability IDs: `containment_action.propose`, `containment_action.approve`, `containment_action.execute`, `containment_action.rollback`.

## Commands / queries / events
Each command emits `aud_` records (CTR-CAP-001 R08).

## States & transitions
Grant revocation mid-approval invalidates pending approvals at execute time.

## Validation & errors
| Actor | Action | Result |
|---|---|---|
| ope (responder) | propose | allow |
| ope (proposer) | approve own | DENY, CAP.SELF_APPROVAL_FORBIDDEN |
| ope (responder) | approve | allow once per approver |
| sys | execute with two approvals | allow |
| sys | execute with one approval | DENY, RESPONSE.TWO_APPROVERS_REQUIRED |
| user | any | DENY, SYS.NOT_FOUND |

## Authorization
Time-bound grants (`expires_at` ≤ 72 h, CTR-CAP-001 R06).

## Failure, idempotency, concurrency, offline
Denials recorded as `dec_`.

## Privacy, retention, abuse
Decision records hold IDs and rule names only.

## Observability & budgets
Counter `response_authz_denied_total{rule}`.

## Tests
- TEST-PS-132-05-01: unit, decision table.
- TEST-PS-132-05-02: negative, self-approval denied.

## Acceptance criteria
1. No containment executes without the approval set.
2. Self-approval denied in 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: Security Lead is a named role holder.
- D10 (administrative recovery of keys): PROVISIONAL (D10 default, unapproved).
