# F15.S03.M01 — observability

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S03 operations](../SPEC.md).

## Purpose and business behavior
Collects pseudonymous logs, metrics, traces and alerts from every ClassRup module so operators can detect fraud spikes, federation gaps, privacy redaction failures and error-code surges, without collecting personal content. This module is the enforcement point for log redaction (no precise location, no names, no key material in telemetry). It is not a user-facing analytics product.

## User stories
- As an operator, I see error-code rates and queue depths for each module and get paged when a threshold is crossed.
- As a privacy lead, I can verify that no precise location or personal data reached telemetry in the last 30 days.
- As a moderator, I see aggregate fraud-signal trends without drilling into a user's activity.

## Scope
Telemetry ingest, redaction, metric labels, alert rules and states, dashboards (aggregate), retention of operational telemetry. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Internal `telemetry.ingest`, `alert.acknowledge`, `alert.silence`, `alert_rule.create`, `alert_rule.retire`; query `telemetry.aggregate`. Error codes `OBSERV.*` (module code limited to 8 letters by CTR-ERR-001 R02).

## Relationships, dependencies and integration
Depends on F15.S02.M02 (API emitters). Consumed by F02.S02.M02 (cycle matching metrics), F04.S02.M02 (sniping signals), F12.S03.M02 (fraud signals), F16.S03.M02 (incident response). Contracts: CTR-EVT-001, CTR-ERR-001 for codes, CTR-PRV-001 for redaction.

## Data ownership
Canonical owner of record class "telemetry record and alert instance". Other modules own their own domain records; they reference this module only for metrics they emit.

## Risk considerations
Telemetry becoming a shadow database of personal data; redaction misses on new fields; alert fatigue hiding real fraud; cardinality explosion from user-controlled labels. Mitigations in PS-121-02, -03, -05 and -07. Vendor processor choice is open (F10).

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; redaction fixture corpus agreed with F10; alert rule catalog reviewed by F16.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-121-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-121-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-121-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-121-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-121-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-121-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-121-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-121-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-121-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-121-10)
