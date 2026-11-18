# PS-146-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-146-05.R02 | Propose needs `prohib.rule.propose`; publish or retire needs `prohib.rule.approve`, not held by the proposer. | MVP |
| PS-146-05.R03 | Decisions are readable by the listing author (`participant`/`self`) and by F12 moderators with a case scope. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Policy editor `acc_` with `prohib.rule.propose` | prohibition_rule.create | global | ALLOW |
| Approver `acc_` with `prohib.rule.approve` | prohibition_rule.accept, retire | global | ALLOW if not proposer |
| Listing service `sys_` | classification.create | global | ALLOW |
| Listing author `acc_` | classification_decision.read | self | ALLOW (outcome and reason keys only) |
| Moderator `mod_` | classification_decision.read | case | ALLOW with `case_ref` |
| Any other principal | classification_decision.read | global | DENY |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Non-visible decisions: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Revocation at next decision. No offline authorization path.

## Assumptions & open decisions
- ASSUMPTION: moderator access rules follow F12 review; not defined here.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
