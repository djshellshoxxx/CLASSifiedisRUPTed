# PS-146-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-10.R01 | Catalogue import is proposal-only and schema-validated. | MVP |
| PS-146-10.R02 | Export of the published catalogue excludes any detection field (none exists) and any decision data. | MVP |
| PS-146-10.R03 | Rollback retires the new rule and republishes the prior version; decisions keep the version applied. | MVP |
| PS-146-10.R04 | Backups restore records; restore re-classifies no drafts. | MVP |

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
- TEST-PS-146-10-01 (integration): a catalogue import creates proposals only.
- TEST-PS-146-10-02 (integration): rollback leaves past decisions on the version they applied.

## Acceptance criteria
1. TEST-PS-146-10-01, TEST-PS-146-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: decision export is limited to F12 case review.
- D07 default: PROVISIONAL (D07 default, unapproved).
