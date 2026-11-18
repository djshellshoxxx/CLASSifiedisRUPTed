# F15.S03.M03 — recovery

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S03 operations](../SPEC.md).

## Purpose and business behavior
Runs the platform's disaster-recovery procedure: restore a verified backup set into an isolated environment, prove the event chain and deletions and holds are intact, rebuild derived data, and only then promote to production. It also records recovery drills with measured RTO and RPO. It restores platform data, not individual accounts (account recovery is F07) and not cycle state (F02.S03.M04 handles that after restore).

## User stories
- As a platform operator, I can restore the platform to a known good point after data loss, with two people approving each step that touches data.
- As a participant, a record I deleted does not come back after a restore.
- As a platform lead, I can see measured recovery time and recovery point from the last drill.

## Scope
Restore runs, runbook execution, drill records, post-restore consistency checks and isolated data destruction. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Internal `restore_run.create`, `restore_run.approve`, `restore_run.step`, `restore_run.promote`, `restore_run.abort`, `drill_record.create`, `drill_record.read`. Error codes `RECOVERY.*` (module code 8 letters, CTR-ERR-001 R02).

## Relationships, dependencies and integration
Depends on F15.S03.M02 (backup sets) and F16.S03.M03 (incident response, change approval). Consumed by F02.S03.M04 (cycle recovery after restore), F11.S03.M03 (federation migration resync) and F17.S02.M02 (chaos and drill tests). Contracts: CTR-EVT-001 (chain), CTR-PRV-001 (tombstones, holds), CTR-CAP-001 (dual control).

## Data ownership
Canonical owner of record class "restore run and DR drill record". Content restored belongs to the owning modules; this module owns no content.

## Risk considerations
Restore resurrects deleted data; unapproved restore exposes all data classes; restore completes with a silent event gap; federated peers diverge after restore; RTO targets are unmeasured. Mitigations in PS-122-02, -03, -05, -06 and -07.

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; first full drill scheduled; `rst` and `drl` prefixes approved; D07 and D10 reviewed for restore impact.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-122-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-122-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-122-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-122-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-122-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-122-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-122-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-122-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-122-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-122-10)
