# PS-043-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-10. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** F10 (portability and deletion requests), F15 (backup, restore, release), operators.

## Purpose and scope
Defines the export format for a party's own return records, the restricted import path (restore only), backup and restore boundaries, and rollback boundaries for releases and feature flags. No record in this module is ever imported from another platform or from a federated peer in MVP.

**Exclusions:** full-platform backup mechanics (F15); federated import (deferred, A-return-27); deposit and handover exports (their modules).

## Requirements
- PS-043-10.R01: Business outcome: a participant can take a portable copy of their own return history; operators can restore the module to a known point; a release can be rolled back without corrupting records. Actors and exclusions as above.
- PS-043-10.R02: Case coverage: export with counterparty notes, export of an active return, export with legal hold, restore to a point before a terminal transition, restore with events already consumed downstream, import of the same file twice, import of a file from a newer schema, rollback after the first transition with the new code.
- PS-043-10.R03: Accessibility: export status and restore status are plain text; exported files are UTF-8 with no byte-order mark.
- PS-043-10.R04: Import never creates transitions, outbox rows or events; import writes only when restoring a state that was already committed.
- PS-043-10.R05: Rollback never deletes or edits transition rows.

## Export format (NDJSON v1, A-return-26)
- File: UTF-8, one JSON object per line, LF newlines, no byte-order mark.
- File name: `rental-returns-<export_id>-<part>.ndjson`, parts of at most 5,000 lines.
- First line is a header object; following lines are return objects.

Header:
```json
{"record_type":"header","export_schema_version":1,"export_id":"01J8XEXP000000000000000001","participant_ref":"01J8XPART00000000000000001","generated_at":"2026-11-20T08:00:00Z","record_count":2}
```

Return object (one line, wrapped for readability):
```json
{"record_type":"return","return_id":"01J8XRTN000000000000000001","rental_id":"01J8XRNT000000000000000001",
 "role_of_requester":"renter","state":"confirmed","revision":3,"due_at":"2026-11-14T18:00:00Z",
 "initiated_at":"2026-11-14T17:40:13Z","returned_at":"2026-11-14T17:35:00Z","declared_at":"2026-11-14T17:40:20Z",
 "timing":"on_time","lateness_minutes":0,"condition_declared":"unchanged",
 "renter_note":"Returned in same condition.","owner_note":"[redacted-counterparty]",
 "dispute_reason_code":null,"terminal_at":"2026-11-15T09:12:00Z","schema_version":1,
 "transitions":[{"revision":1,"to_state":"initiated","occurred_at":"2026-11-14T17:40:13Z"}]}
```

Rules:
- Only rows where the requester is renter or owner are included.
- Counterparty notes are `[redacted-counterparty]`; own notes are included.
- Fields not listed above (participant ids of the counterparty, return_point_ref, legal_hold_ref, resolution_ref, actor_participant_id) are omitted. Return point details are available via mod_handoff under its own export.
- Ordering: `initiated_at` ascending, then `return_id`.
- Export is generated from a consistent snapshot (repeatable read) and is idempotent per (participant, export request id) within 24 h.

## Import (restore only)
- Import is accepted only from F15 restore tooling and from F10 when restoring a participant's data after an approved request. Public import endpoints are not offered.
- Each record is upserted by return_id with a revision check: a record with revision greater than the stored revision is rejected with RETURN_IMPORT_REJECTED (details.reason = `newer_than_stored`); equal revision with identical content is a no-op; a record with an unknown export_schema_version is rejected with RETURN_IMPORT_REJECTED (details.reason = `unsupported_schema`).
- Importing the same file twice is a no-op on the second run.
- Import writes no transition rows, outbox rows or events (PS-043-10 R04). Restored state that conflicts with already-published events is reported to the operator as a reconciliation item.

## Backup and restore boundaries
- Backups are F15-owned. This module requires point-in-time recovery at 5-minute granularity for `rental_return`, `rental_return_transition` and `rental_return_outbox` together (A-return-28).
- Restore target: RPO 5 minutes, RTO 4 hours (A-return-28).
- After restore to time T: rows and transitions after T are absent; outbox rows after T are absent; events published after T before the incident are not replayed. A reconciliation job compares committed transitions against published events in the window and reports gaps for operator action. Duplicate events are handled by consumer dedupe (PS-043-06).
- Idempotency records older than T may be missing after restore; replays of commands issued before T may create a new transition only if the state rules allow it. The state rules still prevent duplicate terminal transitions.

## Migration and release boundaries
- Schema migrations are forward-only and expand-then-contract: first add nullable columns or new tables, then deploy code that writes both, then backfill, then remove old paths in a later release.
- Code released with schema N must run against schema N+1 without error.
- No migration deletes or rewrites rows in `rental_return_transition`.

## Rollback
- Feature flag `rental_return.enabled` (F15 configuration): when false, all commands return RETURN_FEATURE_DISABLED (503, not retryable); queries keep working so that participants can still read history.
- Code rollback: allowed to any release that supports the current schema version. Rolling back a schema change is not performed; the expand step is kept.
- Rollback never removes rows or transitions. Pending outbox rows are published by the previous release's relay, which must support the same envelope.
- A transition committed by a faulty release is corrected only by forward transitions (PS-043-06 Compensation) or by a moderator-resolved dispute.

## Open decisions
- A-return-26: Export format is NDJSON v1 with the header and rules above; additional formats are deferred.
- A-return-27: Import is restore-only in MVP; federated or cross-platform import is deferred until CTR-FED-001 is published (owner F11).
- A-return-28: Backup granularity 5 minutes, RPO 5 minutes, RTO 4 hours are MVP targets pending F15 confirmation.
