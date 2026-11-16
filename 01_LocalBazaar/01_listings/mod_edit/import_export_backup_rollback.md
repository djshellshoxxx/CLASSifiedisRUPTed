# PS-003-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 R06, R11, R12 (retention, export, deletion record), CTR-SCH-001 (schema versions), CTR-EVT-001 R07–R08 (schema check, immutable events).

**Decision labels:** Export and deletion scope PROVISIONAL (D07 default, unapproved). Device queue survival window ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-10.R01 | Owner export includes current editable fields and `revision` of each owned listing at their CTR-PRV-001 classes. Edit history is not exported: this module stores none (PS-003-07 R04). | MVP |
| PS-003-10.R02 | No bulk import. Fields are set by `listing.edit`, one listing per call (PS-003-04 R01). | MVP |
| PS-003-10.R03 | Backups restore listing revisions and outbox rows. Restore replays outbox rows idempotently by `event_id` and does not re-emit events already dispatched. | MVP |
| PS-003-10.R04 | After module rollback, unknown keys from a newer client are rejected with `EDIT.FIELD_NOT_EDITABLE`. The queued item is kept for owner review, not dropped. | MVP |
| PS-003-10.R05 | Feature flag off (mod_flags): `listing.edit` returns `SYS.UNAVAILABLE` (retryable). Device queues are kept up to 30 days (ASSUMPTION), then the owner is notified. | MVP |
| PS-003-10.R06 | Changes to `listing.updated` are additive MINOR only (CTR-SCH-001). MAJOR requires a migration plan. | MVP |

## Data / schema
Export shape: `{listing_id, revision, state, title, description, category_id, region_cell, price, currency, updated_at}`. No idempotency records are exported (RET-OPS).

## Commands / queries / events
Export uses `listing.get_for_edit`. Restore uses outbox replay. No new command.

## States & transitions
Rollback and restore never change `state` (PS-003-03 R01).

## Validation & errors
Outbox row with unknown schema MAJOR is held, not dropped (`SCH.UNKNOWN_VERSION`, CTR-EVT-001 R07).

## Authorization
Export is owner-only (`lst.read`). Restore runs under operator procedures outside this module (runbook owner PENDING, F15).

## Failure, idempotency, concurrency, offline
Device queue survives module rollback. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Exports and backups expire per their retention class; restore replays deletions (CTR-PRV-001 R06). See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Export and restore counts only. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-10-01 (integration): export then import of a listing fixture round-trips editable fields.
- TEST-PS-003-10-02 (restore): restore of backup taken before 10 edits gives correct revisions and no duplicate `listing.updated`.
- TEST-PS-003-10-03 (rollback): older build receives newer client's unknown key; queued item kept.
- TEST-PS-003-10-04 (flag): flag off returns `SYS.UNAVAILABLE`; queue retained.
- TEST-PS-003-10-05 (schema): MINOR change passes compatibility checker; MAJOR without migration blocked.

## Acceptance criteria
1. No edit or queued item is lost by rollback or restore.
2. No duplicate `listing.updated` after restore.
3. Export contains no field outside the listed shape.

## Assumptions & open decisions
- ASSUMPTION: 30-day device queue retention.
- D07 (PROVISIONAL, Dxx default, unapproved): retention and legal-hold scope for exports and backups.
- D08 (PROVISIONAL, Dxx default, unapproved): local pending queue.
