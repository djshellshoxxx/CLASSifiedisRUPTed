# F10.S01.M02 — retention

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (F10). **Parent:** [F10.S01 data_controls](../SPEC.md).

## Purpose and business behavior
Own the retention policy for every data class in ClassRup: the maximum keep period per RET-* class, the anchor that starts each clock, the sweep that purges expired records across replicas, caches and indexes, and the scoped legal holds that suspend purge. Policy changes are versioned and approved by F10; lengthening a period needs notice; shortening needs a migration plan. The module does not decide the legal length of any period; those values stay PENDING jurisdiction review (R07).

## User stories
- As a privacy lead, I can publish a versioned retention policy and see which fields each class covers.
- As a case operator, I can place a scoped hold on a dispute or moderation case that stops purge only for matching records.
- As a participant, I know when my messages and location-derived data expire.
- As an operator, I see sweep backlog and hold counts without seeing record content.

## Scope
- In: policy table, class anchors, sweep scheduling, scoped holds with dual control, policy versioning, retention metrics.
- Out: deletion requests (`mod_delete`), export package expiry (`mod_export`, RET-EPH), federation tombstone semantics (F11.S02), moderation case creation (F12).
- Required process specs (registry PS-079-01 to PS-079-10):
  - [domain_schema.md](domain_schema.md) (PS-079-01)
  - [validation_rules.md](validation_rules.md) (PS-079-02)
  - [workflow_state_machine.md](workflow_state_machine.md) (PS-079-03)
  - [commands_queries_events.md](commands_queries_events.md) (PS-079-04)
  - [authorization_capabilities.md](authorization_capabilities.md) (PS-079-05)
  - [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-079-06)
  - [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-079-07)
  - [observability_performance.md](observability_performance.md) (PS-079-08)
  - [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-079-09)
  - [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-079-10)

## Public interfaces
Commands `retention.policy.publish|activate`, `retention.hold.apply|release`; queries `retention.policy.get_active`, `retention.hold.list_active`; events `retention.*`, `hold.*`, `record.expired`, `record.purged`. Errors `RETAIN.*`.

## Relationships, dependencies and integration
Upstream: field registry (CTR-SCH-001), case lifecycle (F12.S01 reporting and F12.S02 policy), dual-control approvals (F16.S01.M01 `mod_authorization`). Downstream: deletion (F10.S01.M04), export expiry (F10.S01.M03), backups (F15.S03.M02), federation dedupe retention (F11.S02.M02 `mod_dedup`).

## Data ownership
Owns: `retention_policy`, `retention_hold`, `retention_sweep_run`. Does not own: the records purged (feature owners), evidence content (F09).

## Risk considerations
- Holds used to block a subject's legitimate deletion or to keep data longer than policy.
- Sweep bug purges a record under hold.
- Silent lengthening of a period without approval.
- Restore from backup drops a hold.
- Legal periods chosen without jurisdiction review.

## Completion criteria
- All ten canonical process specs SPEC-DRAFT-COMPLETE (pending approval).
- R07 jurisdiction items recorded as OPEN with owner.
- Hold dual-control and sweep invariants have tests (PS-079-09).

## Required process specification inventory
- [x] `domain_schema.md` — PS-079-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-079-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-079-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-079-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-079-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-079-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-079-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-079-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-079-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-079-10 — SPEC-DRAFT-COMPLETE (pending approval)
