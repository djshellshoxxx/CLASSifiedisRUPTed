# PS-148-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-10.R01 | Figures are imported only from aggregate job outputs that have passed suppression; no row-level import. | MVP |
| PS-148-10.R02 | Export of published reports is public (CSV or JSON); no draft export by default. | MVP |
| PS-148-10.R03 | Rollback is a superseding report; the rolled-back report remains readable. | MVP |
| PS-148-10.R04 | Backups restore records; restore re-publishes nothing. | MVP |

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
- TEST-PS-148-10-01 (integration): figures are imported only from suppressed aggregate outputs.
- TEST-PS-148-10-02 (integration): backup restore publishes nothing.

## Acceptance criteria
1. TEST-PS-148-10-01, TEST-PS-148-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: report history is kept indefinitely.
- D07 default: PROVISIONAL (D07 default, unapproved).
