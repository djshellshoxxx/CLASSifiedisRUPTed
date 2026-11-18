# F08.S01.M03 — attachments

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** F08.S01.

## Purpose and business behavior
Lets participants of a private message thread (`thr_`) send up to five images or PDFs per message (`msg_`), with server-side sniffing, re-encoding, metadata stripping and malware scanning before any recipient can open a file. Stores encrypted bytes for the retention period and serves them only through short-lived, participant-bound access grants. Does not own message text (mod_private), thread participation (mod_private), or payment or evidence documents (F09 and mod_evidence).

## User stories
- As a sender, I attach a photo of an item and the location data in the photo is removed before anyone receives it.
- As a recipient, I open an attachment only after it has passed a malware scan, and I cannot open attachments from threads I am not in.
- As a sender, I delete a message for everyone and its attachments disappear within 24 hours.
- As Trust&Safety, I review a reported attachment under dual control without seeing it outside a case.

## Scope
- [domain_schema.md](domain_schema.md) — PS-059-01
- [validation_rules.md](validation_rules.md) — PS-059-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-059-03
- [commands_queries_events.md](commands_queries_events.md) — PS-059-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-059-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-059-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-059-07
- [observability_performance.md](observability_performance.md) — PS-059-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-059-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-059-10

## Public interfaces
Commands `InitiateUpload`, `UploadChunk`, `CompleteUpload`, `PurgeAttachment`; query `GetAttachmentAccess`; events `attachment.uploaded`, `attachment.scan_passed`, `attachment.scan_failed`, `attachment.purged` (CTR-EVT-001). Details in PS-059-04.

## Relationships, dependencies and integration
Upstream: mod_private (thread, message commit and participation), mod_sessions, scanner service (F16 operated), F16 hash block list. Downstream: mod_private displays attachment states; mod_evidence does not consume message attachments. Canonical IDs: CTR-ID-001 `att`, `msg`, `thr`.

## Data ownership
Owns attachment bytes (re-encoded), metadata rows, chunk tables and access grants. Does not own message text, thread membership, payment documents or identity documents. Retention per PS-059-07.

## Risk considerations
Specific to attachments: (1) photos carrying GPS or device identifiers that expose a home or meetup place; (2) malware and active content in PDFs or polyglot images; (3) decompression bombs exhausting server memory; (4) access links shared outside the thread; (5) scanner outage letting unscanned files through; (6) retention drift keeping private images after deletion. Scanning and metadata stripping reduce, but do not eliminate, these risks.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-059-*.Rnn` mapped to `TEST-PS-059-*`; scanner and encryption library choices recorded from audited options; D07 and D08 approved or kept PROVISIONAL; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-059-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-059-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-059-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-059-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-059-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-059-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-059-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-059-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-059-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-059-10, SPEC-DRAFT-COMPLETE
