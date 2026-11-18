# F10.S02.M03 — metadata

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (F10; review F16). **Parent:** [F10.S02 security_boundaries](../SPEC.md).

## Purpose and business behavior
Define and enforce what non-content metadata ClassRup may store or transmit. The module owns the per-surface allowlists (HTTP, server logs, event envelopes, attachment ingest, push, federation, error responses), the attachment sanitiser that removes GPS, device, author and thumbnail tags before storage, the egress filter that fails closed, and the timestamp and IP truncation rules. Its main goal is that a listing photo, a log line or a push preview cannot reveal a home address, a device or a person's network location.

## User stories
- As a seller, I can upload listing photos without revealing where they were taken or which phone took them.
- As a participant, I see that some visual details (faces, street signs) are not removed by the tool.
- As an operator, I can see how much metadata was removed without seeing any removed value.
- As a privacy lead, I can block any outbound surface that carries a field not on its allowlist.

## Scope
- In: seven surfaces; attachment sanitisation for JPEG, PNG and WebP; egress filter; log allowlist; IP truncation; timestamp granularity.
- Out: attachment storage and delivery (F08.S01.M03 `mod_attachments`); visual-identifier detection (Future); PDF and HEIC sanitisation (Future, documented deferral); padding of message lengths (Future).
- Required process specs (registry PS-080-01 to PS-080-10):
  - [domain_schema.md](domain_schema.md) (PS-080-01)
  - [validation_rules.md](validation_rules.md) (PS-080-02)
  - [workflow_state_machine.md](workflow_state_machine.md) (PS-080-03)
  - [commands_queries_events.md](commands_queries_events.md) (PS-080-04)
  - [authorization_capabilities.md](authorization_capabilities.md) (PS-080-05)
  - [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-080-06)
  - [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-080-07)
  - [observability_performance.md](observability_performance.md) (PS-080-08)
  - [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-080-09)
  - [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-080-10)

## Public interfaces
Internal: `metadata.sanitize_attachment`, `metadata.egress_filter`. Admin: `meta.policy.publish|activate`, `meta.policy.get_active`. Events `attachment.metadata_stripped`, `attachment.quarantined`, `meta.policy_*`. Errors `META.*`.

## Relationships, dependencies and integration
Upstream: attachment upload (F08.S01.M03 `mod_attachments`), event envelope rules (F15.S02.M02 `mod_api`, CTR-EVT-001), logging (F15.S03.M01 `mod_observability`). Downstream: push (F13.S01.M01 `mod_push`), federation batches (F11.S02.M01 `mod_delivery`), data export (F10.S01.M03 `mod_export`), backups (F15.S03.M02 `mod_backups`).

## Data ownership
Owns: `metadata_policy`, `attachment_metadata_report`, sanitiser job state. Does not own: attachment bytes or state (F08.S01.M03), precise location (F10 disclosure rules).

## Risk considerations
- Photos with embedded GPS reveal a seller's home.
- Device serial or author tags link one account to a camera or person.
- Logs or previews leak IP addresses, cookies or identifiers.
- Egress filter bypass by a new surface added without a policy row.
- Users over-trust stripping and assume faces or landmarks are removed.

## Completion criteria
- All ten canonical process specs SPEC-DRAFT-COMPLETE (pending approval).
- Sanitiser library chosen in Prompt 3 research with version and licence recorded (PENDING).
- Corpus test (TEST-PS-080-09-01) defined.

## Required process specification inventory
- [x] `domain_schema.md` — PS-080-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-080-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-080-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-080-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-080-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-080-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-080-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-080-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-080-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-080-10 — SPEC-DRAFT-COMPLETE (pending approval)
