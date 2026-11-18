# F11.S03.M03 — migration

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (role). **Parent:** F11.S03.

## Purpose and business behavior
Plan, approve, execute and roll back controlled migrations of federated data: schema version steps (using CTR-SCH-001 migration hooks), node moves, and signing-key rotations. Migrations are dry-run first, dual-approved, checkpointed, verified and reversible within 14 days. Signed evidence keeps its original bytes; migration adds lossless views only.
Naming: the slug `migration` is shortened to `MIGRATE` for error codes (CTR-ERR-001 R02 allows at most 8 letters). Mapping recorded in Assumptions.

## User stories
- As an operator, I can see the exact effect of a migration before approving it.
- As a second approver, I can stop a migration that changes signed evidence.
- As an operator, a crashed migration resumes without duplicates.
- As a participant, my historic signed records still verify after a key rotation.

## Scope
- [domain_schema.md](domain_schema.md) — PS-090-01
- [validation_rules.md](validation_rules.md) — PS-090-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-090-03
- [commands_queries_events.md](commands_queries_events.md) — PS-090-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-090-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-090-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-090-07
- [observability_performance.md](observability_performance.md) — PS-090-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-090-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-090-10

## Public interfaces
Commands `migration.plan`, `migration.approve`, `migration.execute`, `migration.rollback`; query `migration.query_run`. Events `migration.planned`, `migration.approved`, `migration.completed`, `migration.failed`, `migration.rolled_back`. Details in PS-090-04.

## Relationships, dependencies and integration
Upstream: schema registry and hooks (CTR-SCH-001), envelope and key lifecycle (CTR-FED-001, F16), data classes (CTR-PRV-001). Downstream: peer nodes (key rotation notices), F10 review for class changes, observability (F15).

## Data ownership
Owns migration run records and checkpoints. Migrated data remains owned by its aggregate module.

## Risk considerations
Lossy migration of signed evidence, which breaks verification. Migration raising a data class without privacy review. Irreversible moves after the rollback window. Key rotation invalidating historic signatures. Dual-running divergence between nodes. Plans going stale between dry run and execute.

## Completion criteria
All 10 process specs reviewed; lossy-evidence block tested; key-rotation verification test defined; B-06 not affected.

## Required process specification inventory
- [x] `domain_schema.md` — PS-090-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-090-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-090-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-090-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-090-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-090-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-090-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-090-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-090-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-090-10, SPEC-DRAFT-COMPLETE (pending approval)
