# F14.S01.M01 — keyboard

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Accessibility Lead (F14). **Parent:** F14.S01.

## Purpose and business behavior
Keyboard-only operation of every PWA screen: focus order, visible focus, dialog focus trapping and focus return, roving focus in composite widgets (listing grid, message thread, barter cycle participant list), and optional user-set shortcuts. Output is one focus contract per interactive component (static catalog, PUBLIC) plus shortcut binding records. Only account-scope bindings reach the server; focus behavior runs entirely on the client.

## User stories
- As a keyboard-only participant, I reach every action in a listing, a message thread and a cycle consent screen without a pointer.
- As a keyboard-only participant, I close any dialog with Escape and land on the control that opened it.
- As a participant, I change or reset a shortcut, and the change reaches my other devices when I am online.
- As an operator, I disable user shortcuts without disabling focus behavior.

## Scope
In: focus contracts, focus-trap rules, shortcut bindings (device and account scope), reserved-key and conflict rules.
Out: screen reader announcements (F14.S01.M02), WCAG criteria evaluation (F14.S01.M03), component visuals (UI modules), offline replay engine (F15.S01.M01).

## Public interfaces
Commands `kbd.binding.set`, `kbd.binding.reset`; query `kbd.binding.list`; event `keyboard_binding.changed`; error prefix `KBD.`. Detail in PS-109-04 and PS-109-02.

## Relationships, dependencies and integration
Upstream: identity and authorization (F07, F16) for account scope; offline queue (F15.S01.M01) for deferred sync. Downstream: every UI module that declares `component_id` focus contracts. Canonical contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001. Pending: `kbb_` prefix registration in CTR-ID-001.

## Data ownership
This module owns focus contract records and shortcut binding records. UI modules own their components. Account identity remains with F07.

## Risk considerations
Keyboard traps with no exit path; shortcuts that intercept assistive-technology keys or typed text; focus lost after offline banners or consent dialogs; binding data revealing usage patterns. Shortcut capture is disabled whenever a text field has focus. No platform custody of money.

## Completion criteria
All ten process specifications expanded to SPEC-DRAFT-COMPLETE; catalog coverage gate defined; privacy and accessibility review pending (future gate).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-109-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-109-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-109-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-109-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-109-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-109-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-109-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-109-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-109-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-109-10 — SPEC-DRAFT-COMPLETE
