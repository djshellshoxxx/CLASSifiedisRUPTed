# F15.S04.M02 — flags

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S04 configuration](../SPEC.md).

## Purpose and business behavior
Holds the runtime state of each feature flag: rollout percentage, variants, kill switch and expiry. It evaluates flags for a caller's context and returns values, not rules. Flags control exposure only; they never grant access. A kill switch can turn any feature off within 60 s. Feature definitions and their decision gating live in [mod_feature](../mod_feature/SPEC.md).

## User stories
- As an operator, I can turn off a misbehaving feature for everyone within a minute.
- As a release manager, I can ramp a feature to a percentage of users and need a second person to approve each increase.
- As a participant, my experience is stable: the same flag gives me the same result until the rollout changes.

## Scope
Flag rules, deterministic bucketing, evaluation, kill switch and expiry, admin change control. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Client `flag.evaluate`; internal `flag.create`, `flag.update`, `flag.kill`, `flag.clear_kill`, `flag.retire`; queries `flag.read` (ops). Error codes `FLAG.*`.

## Relationships, dependencies and integration
Depends on F15.S02.M02 (API) and F15.S04.M03 (tenants, for tenant targeting). Provides evaluation to F15.S04.M01 (feature) and to every gated module. Contracts: CTR-SCH-001 (rule format), CTR-CAP-001 (admin access).

## Data ownership
Canonical owner of record class "runtime flag definition and rollout state". Moderation reports (`mod_flags` under F12.S01.M01) are a separate record class and are not owned here.

## Risk considerations
Flags used as access control; rollout membership inferred from location or identity attributes; kill switch that does not propagate; silent defaults hiding a broken rollout. Mitigations in PS-124-02, -03, -06 and -07.

## Completion criteria
All ten process specs SPEC-DRAFT-COMPLETE; attribute allow-list approved by F10; kill propagation test planned with F17.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-124-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-124-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-124-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-124-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-124-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-124-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-124-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-124-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-124-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-124-10)
