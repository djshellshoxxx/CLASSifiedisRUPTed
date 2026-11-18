# F12.S01.M02 — evidence

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead. **Parent:** F12.S01.

## Purpose and business behavior
Captures, stores and gates access to the material a report relies on: point-in-time snapshots of reported listings, service and auction pages, messages, attachments and user-supplied images. Each snapshot is scanned, hashed, stripped of location metadata, immutable, and redacted or purged on schedule. Evidence shows what was reported and when. It does not prove that a sale, payment, delivery or handover happened.

## User stories
- As a reporter, I attach up to 10 items to my report, see a receipt, and never see the reported person's identity.
- As a moderator with a case grant, I view snapshots for the stated purpose until the grant expires.
- As a participant named in evidence, I learn the outcome and that evidence about me was used, never who reported me.

## Scope
Ten process specs, all SPEC-DRAFT-COMPLETE: PS-093-01 to PS-093-10 (see inventory below).

## Public interfaces
- Commands: `evidence.capture`, `evidence.redact`, `evidence.legal_hold.apply` (PS-093-04).
- Queries: `evidence.get`, `evidence.list_by_report`, `evidence.content` (grant-gated, ≤ 60 s URL).
- Events (aggregate `evidence`): `evidence.captured`, `evidence.redacted`, `evidence.legal_hold_applied`, `evidence.purged`.
- Identifier: `mev_` (proposed; PENDING CTR-ID-001 registry entry).

## Relationships, dependencies and integration
Upstream: F12.S01.M01 flags (`rpt_`), F08 messages and attachments (`msg_`, `att_` read via F08 contract), F07 accounts (`acc_`), F16 capability model (CTR-CAP-001), F10 retention (CTR-PRV-001). Downstream: F12.S01.M03 appeals and F12.S02.M01 enforcement reference `mev_` IDs by full ID. Not federated.

## Data ownership
Owns: `mev_` snapshot records, scan verdicts, redaction and hold links. Does not own: commerce evidence items `evd_` (F09, per CTR-ID-001 registry), identity evidence (F07.S03.M02), messages or attachments (F08). Canonical owner for moderation evidence snapshots is this module (B-06, PROVISIONAL, unapproved).

## Risk considerations
Third-party privacy exposure through forced captures; forged or edited screenshots; GPS or address leakage in image metadata; scanner outage exposing unscanned content; over-retention; reporter identity leaking through evidence metadata. Evidence is self-attested unless the snapshot came from the authoritative store. No platform custody of money; no payment or delivery assurance.

## Completion criteria
All ten process specs have approval gates passed (Privacy Lead F10, Security Lead F16); TEST-PS-093 IDs pass in a future implementation phase.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-093-01
- [x] [validation_rules.md](validation_rules.md) — PS-093-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-093-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-093-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-093-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-093-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-093-07
- [x] [observability_performance.md](observability_performance.md) — PS-093-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-093-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-093-10
