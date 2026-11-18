# PS-147-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-147-05.R02 | Opening a proposal needs `govern.proposal.open` (any member with standing, ASSUMPTION). | MVP |
| PS-147-05.R03 | Deciding needs `govern.proposal.decide` (steward role); a steward cannot decide a proposal they opened. | MVP |
| PS-147-05.R04 | Publishing a rule needs `govern.rule.publish` and an unused approval ID. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Member `acc_` with standing | governance_proposal.create | global | ALLOW |
| Steward `acc_` with `govern.proposal.decide` | governance_proposal.accept, reject | global | ALLOW if not proposer |
| Steward `acc_` | community_rule.create | global | DENY (rules only via publish) |
| Publisher `acc_` with `govern.rule.publish` | community_rule.publish | global | ALLOW with valid approval ID |
| Any principal | read proposal votes before close | global | DENY |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden proposals: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Revocation of a steward role takes effect at next decision. No offline path.

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
- TEST-PS-147-05-01 (negative): a steward deciding their own proposal receives SYS.FORBIDDEN.
- TEST-PS-147-05-02 (negative): a member reading votes before close is denied.

## Acceptance criteria
1. TEST-PS-147-05-01, TEST-PS-147-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: steward roster is UNASSIGNED until Governance Lead names it.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
