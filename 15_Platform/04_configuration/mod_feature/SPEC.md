# F15.S04.M01 — feature

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S04 configuration](../SPEC.md).

## Purpose and business behavior
Maintains the catalog of ClassRup feature definitions: what each switchable capability is, which module owns it, which open decisions it depends on, which features it requires, and its lifecycle. This module defines features; it does not turn them on. Runtime enablement and rollout belong to [mod_flags](../mod_flags/SPEC.md). Any feature that depends on an open decision (D01–D10) is defined but off by default.

## User stories
- As a platform lead, I can see every switchable capability, its owner module and the decisions it is blocked on.
- As a module owner, I can define a feature for my module and see when it can be activated.
- As a release manager, I can prevent a feature from turning on before its decisions are approved.

## Scope
Feature definitions, catalog validation, lifecycle and catalog snapshots. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Internal commands `feature.define`, `feature.activate`, `feature.deprecate`, `feature.retire`; queries `feature.list`, `feature.get`. Error codes `FEATURE.*`.

## Relationships, dependencies and integration
Depends on F15.S02.M02 (API) and F15.S04.M02 (flags, for enablement state). Consumes DECISIONS.md decision IDs. Contracts: CTR-SCH-001 (definition format), CTR-CAP-001 (administration).

## Data ownership
Canonical owner of record class "feature definition". Flag rollout state is owned by F15.S04.M02; owner modules own the behavior behind each feature.

## Risk considerations
Features turned on before decisions are approved; stale catalog after restore; leaking unreleased security features through names; orphaned features whose owner module is retired. Mitigations in PS-123-02, -03 and -07.

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; every MVP feature in FEATURE_INVENTORY.md has a definition or deferral; D01–D10 status tracked in DECISIONS.md.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-123-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-123-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-123-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-123-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-123-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-123-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-123-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-123-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-123-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-123-10)
