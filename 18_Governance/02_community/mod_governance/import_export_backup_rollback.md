# PS-147-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-10.R01 | Rule text is imported only through a proposal; direct imports are rejected. | MVP |
| PS-147-10.R02 | Export of community rules is public; export of votes is limited to stewards after close. | MVP |
| PS-147-10.R03 | Rollback is a new rule version via proposal; history is kept. | MVP |
| PS-147-10.R04 | Backups restore records; restore issues no approval IDs. | MVP |

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
- TEST-PS-147-10-01 (integration): a direct rule import is rejected.
- TEST-PS-147-10-02 (integration): backup restore issues no approval IDs.

## Acceptance criteria
1. TEST-PS-147-10-01, TEST-PS-147-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: rule history kept for the life of the platform.
- D07 default: PROVISIONAL (D07 default, unapproved).
