# F15.S03.M02 — backups

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S03 operations](../SPEC.md).

## Purpose and business behavior
Creates encrypted, verified, scheduled backup sets of the authoritative ClassRup stores: the event log, aggregate snapshots, schema registry, grant and decision records, and attachment objects. Backups are the source for disaster recovery in [mod_recovery](../mod_recovery/SPEC.md). A backup is usable only after verification passes. Backups hold personal and evidence data, so they are a high-value target and are never exported to users or third parties.

## User stories
- As a platform operator, I can see the age of the last verified backup for each scope and know whether recovery point objectives are met.
- As a platform operator, I am alerted when a backup fails or cannot be verified, before the gap grows.
- As a participant, my deleted data stays deleted when a backup is restored (deletions are replayed).
- As a participant, my signed receipts and listings in a backup are the same bytes that were originally signed.

## Scope
Scheduled full and incremental backup jobs, manifests, encryption, verification, expiry and purge. Restore is owned by [mod_recovery](../mod_recovery/SPEC.md). Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Internal commands `backup.schedule`, `backup.run`, `backup.verify`, `backup.expire`, `backup.purge`; queries `backup.list`, `backup.get`. No client-facing API. Error codes `BACKUP.*`.

## Relationships, dependencies and integration
Depends on F15.S02.M03 (storage) and F16.S02.M02 (key management, KMS-wrapped keys). Consumed by F15.S03.M03 (recovery), F09.S02.M03 (reconciliation), F10.S01.M02 (retention), F10.S01.M04 (delete), F16.S03.M03 (incident response). Contracts: CTR-PRV-001 (disclosure and retention), CTR-SCH-001 (manifest schema).

## Data ownership
Canonical owner of record class "backup set" and its manifest. It owns no content; content owners remain the data-owning modules.

## Risk considerations
Backup theft exposing all data classes; restore resurrecting deleted records; partial sets reported as complete; key loss making sets unreadable; silent RPO drift. Mitigations in PS-120-03, -05, -06 and -07. Retention and key recovery depend on open decisions D07 and D10.

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; manifest schema registered after `bkp` prefix is approved; restore drill defined with PS-122; D07 and D10 decided.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-120-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-120-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-120-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-120-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-120-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-120-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-120-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-120-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-120-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-120-10)
