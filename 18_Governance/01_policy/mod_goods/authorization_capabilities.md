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

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-144-05-01 (negative): a proposer publishing their own category receives SYS.FORBIDDEN.
- TEST-PS-144-05-02 (negative): a listing service attempting goods_category.update is denied.

## Acceptance criteria
1. TEST-PS-144-05-01, TEST-PS-144-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: role names are provisional until Governance Lead confirms.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
