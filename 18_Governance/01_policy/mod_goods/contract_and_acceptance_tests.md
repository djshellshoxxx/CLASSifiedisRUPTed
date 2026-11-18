# PS-144-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-09.R01 | Every restriction flag in the v1 taxonomy resolves to a rule ID. | MVP |
| PS-144-09.R02 | Taxonomy v1 has no cycles, no orphan parents and no duplicate labels per locale. | MVP |

## Tests
- TEST-PS-144-09-01 (unit): cycle and depth-7 category rejected with GOODS.CYCLE_OR_DEPTH.
- TEST-PS-144-09-02 (contract): restriction flag without rule ID rejected.
- TEST-PS-144-09-03 (integration): listing created with deprecated key is migrated; new listing with it is rejected.
- TEST-PS-144-09-04 (lint): GOODS codes pass CTR-ERR-001 registry lint.
- TEST-PS-144-09-05 (a11y): category labels available as localized keys for screen-reader navigation.

## Acceptance criteria
1. All TEST-PS-144-09-01 to -05 pass.
2. Taxonomy v1 passes R01–R02 of this file.

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
- ASSUMPTION: test taxonomy is synthetic.
- D07 default: PROVISIONAL (D07 default, unapproved).
