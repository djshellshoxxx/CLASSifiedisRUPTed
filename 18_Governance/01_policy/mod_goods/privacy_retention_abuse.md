# PS-144-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-07.R01 | Taxonomy holds no personal data; approver and proposer IDs are `acc_` references only. | MVP |
| PS-144-07.R02 | Category use counts exposed publicly are aggregated over at least 10 listings (ASSUMPTION). | MVP |

## Abuse controls
- **Category shopping:** placing restricted goods in a benign category is detected by listing reports, routed to mod_prohibited review (F12).
- **Proposal spam:** max 5 open proposals per proposer (ASSUMPTION).

## Retention
Published versions kept indefinitely for audit (ASSUMPTION); proposals rejected are deleted after 90 days (D07 default, PROVISIONAL).

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-144-07-01 (privacy): taxonomy export contains no listing data.
- TEST-PS-144-07-02 (unit): category use counts below 10 listings are not exposed.

## Acceptance criteria
1. TEST-PS-144-07-01, TEST-PS-144-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no user-generated category names.
- D07 default: PROVISIONAL (D07 default, unapproved).
