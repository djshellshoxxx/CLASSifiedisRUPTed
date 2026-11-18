# PS-147-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-09.R01 | Every approval ID produced is consumed by exactly one publish or expires. | MVP |
| PS-147-09.R02 | No rule version changes without a decided proposal. | MVP |

## Tests
- TEST-PS-147-09-01 (unit): quorum of 1 rejected with GOVERN.QUORUM_NOT_MET.
- TEST-PS-147-09-02 (negative): proposer approving own proposal → GOVERN.SELF_APPROVAL_FORBIDDEN.
- TEST-PS-147-09-03 (integration): decided approval ID publishes once; second attempt rejected.
- TEST-PS-147-09-04 (privacy): vote query before close returns no choices.
- TEST-PS-147-09-05 (lint): GOVERN codes pass CTR-ERR-001 registry lint.

## Acceptance criteria
1. All TEST-PS-147-09-01 to -05 pass.
2. Policy modules can cite approval IDs from this module only.

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

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Assumptions & open decisions
- ASSUMPTION: test steward roster is synthetic.
- D07 default: PROVISIONAL (D07 default, unapproved).
