# F10.S01.M04 — delete

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (F10). **Parent:** [F10.S01 data_controls](../SPEC.md).

## Purpose and business behavior
Execute a data subject's erasure requests. A subject can delete an account, a content item, a message, an attachment or a profile field. The module records the request, applies a 72 h cancellable cooling-off window to account deletion, propagates deletion to every store class (primary, replicas, caches, search indexes, exports, backups, federation tombstones), honours legal holds from `mod_retention`, and writes a completion record with IDs and counts only. It does not delete commerce evidence (redacted under RET-EVD only) and cannot recall copies that counterparties already saw.

## User stories
- As a participant, I can delete my account after re-authenticating and cancel within 72 h if I change my mind.
- As a participant, I see which items were deleted, which are held for a dispute or moderation case, and which failed.
- As a counterparty, I know my copy of a shared message is not recalled by someone else's deletion.
- As an operator, I can see propagation progress without seeing subject content.

## Scope
- In: subject-initiated deletion across five scopes; propagation; holds; completion record; federation tombstones for owned federated items.
- Out: retention schedules (`mod_retention`), subject exports (`mod_export`), hold creation (F12 case flow), legal interpretation of erasure duties.
- Required process specs (canonical, registry PS-077-01 to PS-077-10):
  - [domain_schema.md](domain_schema.md) (PS-077-01)
  - [validation_rules.md](validation_rules.md) (PS-077-02)
  - [workflow_state_machine.md](workflow_state_machine.md) (PS-077-03)
  - [commands_queries_events.md](commands_queries_events.md) (PS-077-04)
  - [authorization_capabilities.md](authorization_capabilities.md) (PS-077-05)
  - [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-077-06)
  - [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-077-07)
  - [observability_performance.md](observability_performance.md) (PS-077-08)
  - [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-077-09)
  - [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-077-10)

## Public interfaces
Commands `privacy.deletion.request`, `privacy.deletion.cancel`; queries `privacy.deletion.get`, `privacy.deletion.list_own`; events `deletion.*`, `record.deleted`, `<aggregate_type>.tombstoned`. Errors `DEL.*` (PS-077-02). Schemas in PS-077-04.

## Relationships, dependencies and integration
Upstream: identity and reauthentication (F07.S01), consent (F10.S01.M01), authorization (F16.S01.M01, CTR-CAP-001). Downstream: notifications (F13, generic text only), moderation holds (F12), federation tombstones (F11.S02.M01 delivery; CTR-FED-001). Backups owned by F15.S03.M02 (`mod_backups`). Retention holds owned by F10.S01.M02 (`mod_retention`). Export and deletion share the `dsr_` request prefix (pending CTR-ID-001).

## Data ownership
Owns: `data_subject_request`, `dsr_target`, `deletion_replay`, completion records. Does not own: the deleted records themselves (their feature owners), commerce evidence (F09), federation replicas (F11.S01.M02).

## Risk considerations
- Incomplete propagation leaves recoverable copies in replicas, indexes or backups (resurrection after restore).
- Deletion used to destroy evidence during a dispute or moderation case.
- Account deletion as a takeover step if reauthentication is weak.
- Tombstones to federated peers are irreversible and may not reach revoked peers.
- Users may believe deletion recalls counterparty copies; the UI must say it does not.

## Completion criteria
- All ten canonical process specs are SPEC-DRAFT-COMPLETE (pending approval).
- Every acceptance criterion maps to a TEST ID (PS-077-09).
- Privacy Lead and Security Lead review recorded (future gate; not approved).

## Required process specification inventory
- [x] `domain_schema.md` — PS-077-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-077-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-077-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-077-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-077-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-077-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-077-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-077-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-077-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-077-10 — SPEC-DRAFT-COMPLETE (pending approval)
