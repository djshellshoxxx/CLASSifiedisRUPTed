# F13.S01.M03 — inapp

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (accountable role; named person UNASSIGNED). **Parent:** F13.S01.

## Purpose and business behavior
Deliver notifications to the in-app inbox of the PWA: create the inbox item from a producer event, apply the recipient's preferences and blocks, sync the list to every device, and track read and dismissed state. Inbox text is rendered on the client from short template keys and labels, so server-side storage holds no message bodies. Delivery is best-effort with explicit states; the inbox never fabricates an unread count when offline.

## User stories
- As a participant, I see a notification when a barter proposal I am in changes, with a short label and no personal content.
- As a participant, marking an item read on one device updates my other devices on next sync.
- As a participant, notifications from someone I blocked do not appear in my inbox.

## Scope
- In-app `ntf_` items: queue, deliver, read, dismiss, expire.
- Inbox list, sync and operation log for offline-queued actions.
- Out of scope: push delivery (`mod_push`), email (`mod_email`), preferences and quiet hours (F13.S02), block list ownership (F08), template content authoring (producer modules).

## Public interfaces
Producer command `ntf.create` (sys_); recipient commands `inbox.mark_read`, `inbox.mark_all_read`, `inbox.dismiss`; queries `inbox.list`, `inbox.sync`, `inbox.export_owner`; events `ntf.queued`, `ntf.suppressed`, `ntf.delivered`, `ntf.read`, `ntf.dismissed`, `ntf.expired`. Details in PS-103-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F13.S01.M01 `mod_push` (delivery acknowledgement), F13.S02.M04 `mod_in` (in-app preferences). Downstream: F08.S03.M03 (messaging notifications consumer). Contracts: CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-CAP-001.

## Data ownership
Canonical record `ntf_` is owned by F13 (prefix registry). This module owns the in-app channel state (`inbox_state`, read and dismissed timestamps, `inbox_revision`). Templates belong to F13 root; blocks to F08; preferences to F13.S02.

## Risk considerations
Leakage of private content on shared devices; notification flooding; harassment through notices; phishing-style notices; stale unread counts after offline use; duplicate notices after producer retries. No platform custody of money; notifications never confirm payments or claims (generic wording only).

## Completion criteria
Platform Lead approval of template registry rules and the forbidden-class scanner scope (not yet obtained); producer contract tests defined; privacy review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-103-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-103-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-103-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-103-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-103-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-103-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-103-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-103-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-103-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-103-10, SPEC-DRAFT-COMPLETE (pending approval)
