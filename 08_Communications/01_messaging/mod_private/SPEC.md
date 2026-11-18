# F08.S01.M01 — private

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** F08.S01.

## Purpose and business behavior
Provides one-to-one private message threads (`thr_`) between two pseudonyms (`prf_`) that have a relation: a recent exchange (open or closed within 30 days) or an accepted contact request. Covers thread creation, message send and delivery, read markers that are off by default, delete-for-me and a 24-hour delete-for-all, blocking and closing. Does not own attachment bytes (mod_attachments), exchange state (F02–F05), meetup planning (mod_coordination) or reports (F12).

## User stories
- As a buyer after a completed exchange, I message the seller in a private thread without sharing a phone number.
- As a user, I receive a contact request from a stranger and can accept or ignore it without the sender learning which.
- As a user, I block someone and they cannot message me or see that I am active.
- As a sender, I delete a message for everyone within 24 hours of sending.

## Scope
- [domain_schema.md](domain_schema.md) — PS-060-01
- [validation_rules.md](validation_rules.md) — PS-060-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-060-03
- [commands_queries_events.md](commands_queries_events.md) — PS-060-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-060-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-060-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-060-07
- [observability_performance.md](observability_performance.md) — PS-060-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-060-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-060-10

## Public interfaces
Commands `RequestContact`, `AcceptContact`, `StartThread`, `SendMessage`, `MarkRead`, `DeleteForMe`, `DeleteForAll`, `CloseThread`, `Block`; queries `ListThreads`, `ListMessages`; events `messaging.thread_opened`, `messaging.message_sent`, `messaging.thread_blocked`, `messaging.message_deleted` (CTR-EVT-001). Details in PS-060-04.

## Relationships, dependencies and integration
Upstream: mod_pseudonyms (`prf_` state), F02–F05 exchange events (eligibility), mod_attachments (`att_` availability), mod_sessions. Downstream: notifications (generic), F12 reports (`rpt_`), mod_coordination (thread context for meetups). Canonical IDs: CTR-ID-001 `thr`, `msg`.

## Data ownership
Owns threads, messages, per-participant thread state, contact requests and blocks. Does not own pseudonyms, attachments, exchanges, meetup records or reports. Retention per PS-060-07.

## Risk considerations
Specific to private messages: (1) unsolicited or harassing contact through recycled pseudonyms; (2) platform-held plaintext access in MVP (no end-to-end encryption), which must be disclosed; (3) message timing revealing trade activity and relationships; (4) scams and off-platform payment requests in message text; (5) block evasion through new pseudonyms; (6) copies retained by recipients after deletion. Private messaging is not a confidential channel against the platform or the other party.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-060-*.Rnn` mapped to `TEST-PS-060-*`; D10 E2E decision recorded (PROVISIONAL default in place); D08 queue decision approved or kept PROVISIONAL; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-060-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-060-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-060-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-060-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-060-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-060-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-060-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-060-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-060-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-060-10, SPEC-DRAFT-COMPLETE
