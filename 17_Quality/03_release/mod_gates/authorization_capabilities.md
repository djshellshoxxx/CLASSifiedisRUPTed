# PS-143-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-143-05.R02 | Gate definition changes need capability `gates.definition.administer` and Governance Lead approval for removals. | MVP |
| PS-143-05.R03 | Granting a waiver needs capability `gates.waiver.grant` held by a principal other than the requester (CTR-CAP-001 R07 pattern, ASSUMPTION). | MVP |
| PS-143-05.R04 | Evaluators (`sys_`) can record decisions but cannot grant waivers. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| QA Lead `acc_` with `gates.definition.administer` | release_gate.create, update | global | ALLOW; removals need Governance approval |
| Approver `acc_` with `gates.waiver.grant` | gate_waiver.create | global | ALLOW if approver ≠ requester |
| Evaluator `sys_` | gate_decision.create | global | ALLOW |
| Evaluator `sys_` | gate_waiver.create | global | DENY |
| Any `acc_` with `gates.decision.read` | gate_decision.read | global | ALLOW |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden decisions: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Revocation of a grant takes effect at next decision (CTR-CAP-001 R09). Offline authorization does not apply.

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
- TEST-PS-143-05-01 (negative): an evaluator principal granting a waiver receives SYS.FORBIDDEN.
- TEST-PS-143-05-02 (negative): removing an evidence type without Governance approval is rejected.

## Acceptance criteria
1. TEST-PS-143-05-01, TEST-PS-143-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: approver roles are UNASSIGNED until F16 and Governance review.
- D10 (auth and portability) not affected: PROVISIONAL (D10 default, unapproved).
