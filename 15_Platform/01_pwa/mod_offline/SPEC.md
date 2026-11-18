# F15.S01.M01 — offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F15). **Parent:** [F15.S01 pwa](../SPEC.md).

## Purpose and business behavior
Holds a participant's state-changing actions in a device-local queue while the PWA is offline, then replays each one to its owner module with the same idempotency key. The module never reports a listing, message, offer or payment as done until the server acknowledges it. Pending, not-applied and upgrade-required states are visible to the user with text, not color alone.

## User stories
- As a participant on a poor connection, I can create a listing, reply to a message or accept an offer, and see it marked pending until the server confirms it.
- As a participant whose queued action was rejected (for example, the item was taken), I see the reason and can discard or re-run it after review.
- As a participant on a shared device, I can see what is pending before I switch accounts or log out.

## Scope
Local queue, replay, state display and discard for PWA offline writes. Owner modules keep their own command semantics. Process specifications: [domain_schema](domain_schema.md), [validation_rules](validation_rules.md), [workflow_state_machine](workflow_state_machine.md), [commands_queries_events](commands_queries_events.md), [authorization_capabilities](authorization_capabilities.md), [failure_recovery_idempotency](failure_recovery_idempotency.md), [privacy_retention_abuse](privacy_retention_abuse.md), [observability_performance](observability_performance.md), [contract_and_acceptance_tests](contract_and_acceptance_tests.md), [import_export_backup_rollback](import_export_backup_rollback.md).

## Public interfaces
Local commands `offline.enqueue`, `offline.replay`, `offline.user_discard`, `offline.user_retry`; query `offline.list`. Error codes `OFFLINE.*` per PS-116-02 and PS-116-06, using CTR-ERR-001 envelope.

## Relationships, dependencies and integration
Depends on F15.S01.M02 (cache, same PWA shell) and F15.S02.M03 (storage, server ack path). Consumed by F01.S03.M01 (availability), F03.S01.M02 (service availability) and F05.S01.M01 (rental availability) for offline writes to their own commands. Contracts: CTR-SCH-001 (payload versions), CTR-EVT-001 (idempotency and revision).

## Data ownership
Canonical owner of record class "offline pending command" (device-local). Owner modules own the server-side records their commands create. This module owns no server-side records. F17.S02.M03 (`17_Quality/02_performance/mod_offline`) owns offline performance test scenarios only, not this record class.

## Risk considerations
Silent loss of queued writes, false "done" display on timeout, replay after a grant is revoked, plaintext personal data left in device storage on shared devices, and queue flooding. Mitigations are specified in PS-116-03, PS-116-05, PS-116-06 and PS-116-07. Device encryption depends on the unresolved device key decision (D10).

## Completion criteria
All ten process specs are SPEC-DRAFT-COMPLETE and pending approval; owner modules confirm their offline-capable command list; D08 is approved or replaced; contract and offline e2e tests exist in the test plan.

## Required process specification inventory
- [x] `domain_schema.md` — SPEC-DRAFT-COMPLETE (PS-116-01)
- [x] `validation_rules.md` — SPEC-DRAFT-COMPLETE (PS-116-02)
- [x] `workflow_state_machine.md` — SPEC-DRAFT-COMPLETE (PS-116-03)
- [x] `commands_queries_events.md` — SPEC-DRAFT-COMPLETE (PS-116-04)
- [x] `authorization_capabilities.md` — SPEC-DRAFT-COMPLETE (PS-116-05)
- [x] `failure_recovery_idempotency.md` — SPEC-DRAFT-COMPLETE (PS-116-06)
- [x] `privacy_retention_abuse.md` — SPEC-DRAFT-COMPLETE (PS-116-07)
- [x] `observability_performance.md` — SPEC-DRAFT-COMPLETE (PS-116-08)
- [x] `contract_and_acceptance_tests.md` — SPEC-DRAFT-COMPLETE (PS-116-09)
- [x] `import_export_backup_rollback.md` — SPEC-DRAFT-COMPLETE (PS-116-10)
