# PS-039-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-10. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** participant export (portability journey), 05_Rentals/02_rental_lifecycle (evidence references), operations (backup and restore); shared F10 privacy, F15 platform, F16 security per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-10.R01: Export format, import scope, backup cadence and rollback boundaries are defined. Claims are evidence and are never imported.
- PS-039-10.R02: Export excludes other parties' pseudonyms and any personal data outside this module.
- PS-039-10.R03: Rollback never deletes committed or released claims, and restore is always followed by event replay.

## Export
- Format: JSON Lines, UTF-8, LF line endings, one record per line. Line 1 is a header.
- Header: `{"record_type":"header","export_id":"exp_<ULID>","schema_version":1,"generated_at_utc":"...","scope":"owner|requester","listing_ids":[...]}`.
- Record types: `window`, `block`, `claim`. Each record carries the fields in domain_schema.md, with other-party pseudonyms replaced by `counterparty_ref` (salted per export, not reusable across exports).
- Owner scope: windows and blocks of the owner's listings, and claims on those listings with counterparty requester pseudonym replaced by `counterparty_ref`.
- Requester scope: the requester's own claims only, with listing ID and interval. Owner pseudonym replaced by `counterparty_ref`.
- Limits: at most 50,000 records per file. Larger exports are split into numbered files with the same `export_id`.
- Export is asynchronous. The request returns an export job ID; the file is available for 7 days and then deleted.

Example record:
```json
{"record_type":"claim","claim_id":"01J9Z8X3K4M5N6P7Q8R9S0T1VY","listing_id":"rl_example_0001","starts_at_utc":"2026-12-03T09:00:00Z","ends_at_utc":"2026-12-05T09:00:00Z","state":"released","release_reason":"requester_withdrew","counterparty_ref":"cp_7d2e91","schema_version":1}
```

## Import
- Scope: owner-supplied `window` and `block` records only, for a single listing the owner controls.
- Claim records are rejected on import with `AVAIL_FIELD_UNKNOWN` for `record_type` (A-AVAIL-28). Claims are created only by holds and lifecycle commands.
- Validation runs on the full file before any write. The import is all-or-nothing per listing, with a maximum of 500 records per import.
- Each record goes through the same validation and conflict rules as the live command. Records that overlap existing active windows reject the whole import.
- Imports carry an idempotency key at file level; replay returns the original result.
- Imported windows receive new IDs. Source IDs are not trusted.

## Backup
- Frequency: full snapshot daily; continuous write-ahead log for point-in-time restore within the retention window.
- Retention of backups: 35 days. Backups are encrypted at rest under the platform key policy (F15).
- Backup contents include claims. Backup is therefore subject to the same retention classes as live data; expired records in backup are removed when the backup expires.
- Backups are restored into a separate environment first. Production restore requires operator approval recorded in the audit log.

## Restore and replay
- After any restore, the module replays the event log from the snapshot point to the present, applying each event idempotently by `event_id`.
- Claims in a state committed after the snapshot point are restored from events, not from the snapshot alone.
- Restore is complete only when the outbox backlog is zero and the sweep has run once after replay.

## Rollback
- Feature flag `avail_enabled` (per listing and global). Turning it off makes the module read-only: calendar queries keep working; hold, commit, publish and block commands return `AVAIL_UNAVAILABLE` with retryable false, and lifecycle is notified to pause.
- Turning off the flag never releases committed claims. Commitments remain blocked until lifecycle releases them.
- Schema rollback follows expand-then-contract. Columns and event names are not removed within two releases of introduction.
- A release that fails validation is rolled back by redeploying the previous binary; the database is not reverted, because claims written by the new release must remain valid under the previous schema.

## Boundaries
- No cross-module rollback: this module never reverts rental agreements, deposits or payments.
- No deletion of export files before their 7-day window ends, except on participant deletion request.

## Open decisions
- A-AVAIL-28: Import v1 accepts owner windows and blocks only. Claims are not importable, to keep commerce evidence append-only.
- A-AVAIL-29: Export is JSON Lines with 50,000 records per file and 7-day availability. Chosen for portability over a custom binary format.
