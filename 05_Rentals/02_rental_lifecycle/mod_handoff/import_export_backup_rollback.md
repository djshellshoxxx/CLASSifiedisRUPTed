# PS-042-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-10. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines the portable export format for a participant's handoff records, the rules for import, backup and restore, schema migration and rollback, and the feature-flag boundary. Handoff records are append-only evidence, so import is never a merge into live data.

## Requirements
- PS-042-10.R01 — Business outcome: a participant can export their own handoff records in a documented format for portability. Records cannot be injected into a live relay through import.
- PS-042-10.R02 — Cases covered: export with one counterparty's private note; export for a participant whose account is deleted; import attempt with forged attestations; restore after relay data loss; migration failure mid-way; rollback of code with a v1 schema in place; feature flag disabled with active handoffs.
- PS-042-10.R03 — Backup and restore budgets: RPO 15 minutes, RTO 4 hours, backup retention 35 days ([A-handoff-18](#assumptions-and-open-decisions)).
- PS-042-10.R04 — Rollback boundaries: code can roll back within a schema version; schema migrations are forward-only and expand-then-contract; the feature flag is the primary rollback control.

## Export format
- **Assumption A-handoff-17:** Export is UTF-8 NDJSON, version 1. One file per export. The first line is a header object; each following line is one record of type `handoff`, `attestation` or `transition`.
- Header: `{"export_format":"handoff-ndjson","format_version":1,"schema_version":1,"requested_by":"<participant_id>","generated_at":"<UTC RFC 3339>","record_count":<int>}`.
- Record lines contain the fields in [domain_schema.md](domain_schema.md), with these changes: `handoff.meeting_note` and `attestation.condition_note` are included only for the requesting participant's own statements and for the shared meeting note; `deposit_ref` included as an opaque ID; `signature` included when present; `region_code` included.
- Counterparty `condition_note` text is included, because it is part of the shared record. Counterparty `client_recorded_at` and device-level data are not stored and therefore not exported.
- Records are sorted by `handoff_id`, then `sequence` for transitions. Timestamps are UTC RFC 3339 with milliseconds.
- Export size limit: 50,000 records or 100 MB per file. Larger exports are split into numbered files with the same header format and `part` in the header.

## Export scope and timing
- Export is available to parties and is included in the `handoff.export` capability ([authorization_capabilities.md](authorization_capabilities.md)).
- Export is generated asynchronously and expires after 7 days. Generation completes within 15 minutes for up to 10,000 records.
- Export excludes records under legal hold? No: records under legal hold are exported to the holder only when the hold reason permits. Otherwise the export lists the count of withheld records and a withheld reason code.
- An export of a deleted account contains only the records that still reference the account as a party, with `participant_id` replaced by the tombstone `deleted-participant`.

## Import
- Handoff records are not imported into a live relay. Import is refused with a typed error and no rows are written ([TEST-PS-042-10-T02](contract_and_acceptance_tests.md)).
- Rationale: attestations are evidence from named parties. An import would create records no party made on the platform, which is forgery.
- A future interchange format, if approved, would deliver handoff records as signed federated envelopes under CTR-FED-001. That is out of scope for v1.

## Backup and restore
- Backups: continuous WAL archive plus daily full snapshot. RPO 15 minutes; RTO 4 hours ([A-handoff-18](#assumptions-and-open-decisions)).
- Backups are encrypted at rest. Backup retention is 35 days, after which purged or deleted records cease to exist in backups.
- Restore runs into a clean environment first. It is verified against the restore drill ([TEST-PS-042-10-T03](contract_and_acceptance_tests.md)) and then promoted. Restore never merges into a running relay.
- After restore, the outbox is re-published from the restored state. Consumers deduplicate by `event_id` ([PS-042-04.R04](commands_queries_events.md)).
- Restore leaves in-flight timers to the scheduler, which recomputes deadlines from stored data.

## Migrations and rollback
- Migrations are forward-only, expand-then-contract: add nullable columns or new tables first, deploy readers, backfill, then remove old structures in a later release.
- Each migration is recorded with a migration ID, schema version and checksum. A failed migration halts writes for the handoff tables and leaves reads available.
- Code rollback within schema version 1 is allowed at any time. Rollback past a schema change is not allowed; the fix is a forward release.
- Event schema v1 is kept for at least 12 months after v2 exists, under CTR-SCH-001.

## Feature flag and rollback control
- **Assumption A-handoff-16:** Feature flag `handoff_enabled` defaults to off. It is owned by the platform flag service (F15). Flag off: create and every mutating command return `HANDOFF_FEATURE_DISABLED`; reads, export and scheduler timers continue so that no active handoff is stranded.
- Flag on again: no data repair needed, because state never froze.
- A flag change is an operator action recorded in the audit trail with the actor's pseudonymous ID.

## Data deletion boundary
- Deletion and purge follow [privacy_retention_abuse.md](privacy_retention_abuse.md). Export and restore must respect purge: purged records are never resurrected from backup after the backup window closes.
- Legal hold blocks purge and deletion rewrites and is preserved through restore.

## Assumptions and open decisions
- **Assumption A-handoff-16:** Feature flag `handoff_enabled` default off, flag owned by F15, scheduler continues when off.
- **Assumption A-handoff-17:** Export format NDJSON version 1 with header and 50,000 records per file.
- **Assumption A-handoff-18:** RPO 15 minutes, RTO 4 hours, backup retention 35 days.
- Open decisions in this file: CTR-FED-001 for any future interchange (OPEN); CTR-SCH-001 for schema retention (OPEN); D10 for export key handling (OPEN).
