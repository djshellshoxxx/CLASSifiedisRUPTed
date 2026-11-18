# PS-142-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-10.R01 | Matrix definitions are imported from reviewed repository files and validated against CTR-SCH-001. | MVP |
| PS-142-10.R02 | Export contains the published matrix and results for a release; no device identifiers. | MVP |
| PS-142-10.R03 | Rollback publishes the prior matrix content as a new version; history is kept. | MVP |
| PS-142-10.R04 | Backups restore records only; no tests are re-run on restore. | MVP |

## Notes
- Import: reviewed file, schema check, then `PublishCompatMatrix`.
- Export: JSON for release review.
- Rollback: a new matrix version with prior rows; results for the rolled-back version stay readable.

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
- TEST-PS-142-10-01 (integration): an imported matrix is schema-validated before publish.
- TEST-PS-142-10-02 (integration): rollback keeps results for the rolled-back version readable.

## Acceptance criteria
1. TEST-PS-142-10-01, TEST-PS-142-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: matrix history is kept for the life of the release line.
- D07 (retention) affects backups: PROVISIONAL (D07 default, unapproved).
