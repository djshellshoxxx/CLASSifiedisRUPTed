# PS-077-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10; review F16). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R13), CTR-PRV-001 (R07 hold), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-05.R01 | Capability `privacy_record.delete` with scope `self` for subject requests; `privacy_record.read` with scope `self` for completion records. | MVP |
| PS-077-05.R02 | Deletion of a target requires the actor to be the owner (`self`); participants (counterparties) cannot delete another party's record. | MVP |
| PS-077-05.R03 | Operators (`ope_`) cannot create, cancel or alter subject requests. Operator may apply or release holds only via retention module (PS-079) with dual control. | MVP |
| PS-077-05.R04 | Support staff cannot read or change credentials during account deletion (CTR-CAP-001 R12). | MVP |
| PS-077-05.R05 | `sys_` executor grant: `privacy_record.execute`, scope `global`, constraint `purpose = "subject_deletion"`, `expires_at` ≤ 72 h after `not_before`, revocable. | MVP |
| PS-077-05.R06 | Every request, cancel and execution emits an `aud_` record without content (CTR-CAP-001 R08). | MVP |

## Data / schema
Capability grant rows reference `grt_` IDs (CTR-ID-001). Decision records (`dec_`) store outcome and reason code only (CTR-CAP-001 R13).

## Commands / queries / events
Each command maps to one capability: request/cancel → `privacy_record.delete`; get → `privacy_record.read`; execute → `privacy_record.execute`.

## States & transitions
Authorization is evaluated per command, not per state. Relation rules are derived at decision time (CTR-CAP-001 R05).

## Validation & errors
Unauthorized actor receives `SYS.NOT_FOUND` for objects it cannot read and `SYS.FORBIDDEN` only for visible objects with a denied action (CTR-ERR-001 R08).

## Authorization
Matrix (actor × action × resource):
| Actor | request | cancel | get | execute | hold apply |
|---|---|---|---|---|---|
| subject acc_ | self | self (window) | self | no | no |
| counterparty acc_ | no | no | no | no | no |
| ope_ | no | no | global (no content) | no | no (retention module) |
| sys_ executor | no | no | no | global (purpose-bound) | no |

## Failure, idempotency, concurrency, offline
Decision cache TTL is zero for all writes and PRIVATE-class reads (CTR-CAP-001 R09). Revocation of the executor grant stops execution at the next lease renewal.

## Privacy, retention, abuse
Audit records RET-AUD. Decision records hold no target content.

## Observability & budgets
`del_authz_denied_total{actor_type, action}`; any `ope_` attempt to cancel is an alert.

## Tests
- TEST-PS-077-05-01 (negative): counterparty attempts to delete a shared thread message → SYS.NOT_FOUND.
- TEST-PS-077-05-02 (negative): operator token attempts cancel → SYS.FORBIDDEN.

## Acceptance criteria
1. Matrix above implemented as a deny-by-default rule set (CTR-CAP-001 R01).
2. Negative tests pass for every non-`self` path.
3. Executor grant expiry test shows no execution after `expires_at`.

## Assumptions & open decisions
- ASSUMPTION: executor grant ≤ 72 h.
- PROVISIONAL (D10 default): user-controlled keys govern account-deletion confirmation (see PS-077-06).
