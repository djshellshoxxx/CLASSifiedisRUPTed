# PS-144-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-10.R01 | Taxonomy import is from a reviewed file validated against CTR-SCH-001 and applied as a proposal, never directly published. | MVP |
| PS-144-10.R02 | Export of a taxonomy version is public (`PUBLIC`) and contains no listing data. | MVP |
| PS-144-10.R03 | Rollback publishes an earlier tree as a new version; keys are not reused. | MVP |
| PS-144-10.R04 | Backups restore records only; restore runs no migration. | MVP |

## Notes
- Import: file review, schema check, `ProposeGoodsCategory` per entry, then publish under governance approval.
- Export: JSON per version.

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

## Tests
- TEST-PS-144-10-01 (integration): an imported taxonomy lands as proposals, not published categories.
- TEST-PS-144-10-02 (integration): rollback publishes the earlier tree as a new version.

## Acceptance criteria
1. TEST-PS-144-10-01, TEST-PS-144-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: taxonomy history kept indefinitely.
- D07 default: PROVISIONAL (D07 default, unapproved).
