# PS-141-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-10.R01 | Pipeline definitions are stored as reviewed repository files; the stored `ci_pipeline` version matches the file's commit SHA. | MVP |
| PS-141-10.R02 | Run-record export contains status, digests and timings only; no logs. | MVP |
| PS-141-10.R03 | Backups include run records; restore creates no new runs and dispatches no jobs. | MVP |
| PS-141-10.R04 | Rollback of a pipeline is a new version that reverts the definition; history is kept. | MVP |

## Import, export, backup and rollback
- Import: pipeline definitions load from the repository on merge to main; invalid files fail the merge.
- Export: JSON per run, for gate review and audit; excludes logs and secrets.
- Backup: run records follow platform backup schedule and PS-141-07 retention.
- Rollback: revert the definition commit and publish a new version; runs of the old version stay readable.

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
- TEST-PS-141-10-01 (integration): an invalid pipeline file blocks the merge.
- TEST-PS-141-10-02 (integration): restore creates no new runs and dispatches no jobs.

## Acceptance criteria
1. TEST-PS-141-10-01, TEST-PS-141-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: runners are rebuilt from pinned images; no runner state is backed up.
- D07 (retention) affects backup expiry: PROVISIONAL (D07 default, unapproved).
