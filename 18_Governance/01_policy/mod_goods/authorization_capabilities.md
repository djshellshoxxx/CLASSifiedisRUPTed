# PS-144-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-144-05.R02 | Proposing needs `goods.category.propose`; publishing needs `goods.category.publish` and a governance approval ID. | MVP |
| PS-144-05.R03 | A principal cannot both propose and publish the same category version. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Policy editor `acc_` with `goods.category.propose` | goods_category.create | global | ALLOW |
| Policy approver `acc_` with `goods.category.publish` | goods_category.accept | global | ALLOW if not the proposer |
| Listing service `sys_` | goods_category.read (published) | global | ALLOW |
| Listing service `sys_` | goods_category.update | global | DENY |
| Any `acc_` | goods_category.read (proposed) | global | DENY |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden proposals: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Revocation applies at next decision. No offline authorization.

## Assumptions & open decisions
- ASSUMPTION: role names are provisional until Governance Lead confirms.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
