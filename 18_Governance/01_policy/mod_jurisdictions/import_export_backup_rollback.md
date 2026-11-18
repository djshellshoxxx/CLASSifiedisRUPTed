# PS-145-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-10.R01 | Bulk import of rules is proposal-only and validated against CTR-SCH-001. | MVP |
| PS-145-10.R02 | Export of the register is public and contains no user data. | MVP |
| PS-145-10.R03 | Rollback is a withdrawal plus a new published version; history is kept. | MVP |
| PS-145-10.R04 | Backups restore records only; restore re-applies no rule to past decisions. | MVP |

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
- TEST-PS-145-10-01 (integration): a bulk import creates proposals only.
- TEST-PS-145-10-02 (integration): the register export contains no user data.

## Acceptance criteria
1. TEST-PS-145-10-01, TEST-PS-145-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: register history is kept for the life of the platform.
- D07 default: PROVISIONAL (D07 default, unapproved).
