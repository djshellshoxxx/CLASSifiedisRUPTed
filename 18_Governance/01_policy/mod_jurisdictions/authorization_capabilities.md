# PS-145-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-145-05.R02 | Propose needs `juris.rule.propose`; publish or withdraw needs `juris.rule.approve` held by a principal other than the proposer. | MVP |
| PS-145-05.R03 | Region-level read of the register is public; no principal can read another user's region through this module. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Policy editor `acc_` with `juris.rule.propose` | jurisdiction_rule.create | global | ALLOW |
| Approver `acc_` with `juris.rule.approve` | jurisdiction_rule.accept, withdraw | global | ALLOW if not proposer |
| Listing service `sys_` | jurisdiction_rule.read | global | ALLOW (published only) |
| Any principal | user region lookup | self | not provided by this module (DENY) |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden proposals: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Grant revocation takes effect at next decision. No offline authorization path.

## Assumptions & open decisions
- ASSUMPTION: approver role UNASSIGNED until Governance Lead confirms.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
