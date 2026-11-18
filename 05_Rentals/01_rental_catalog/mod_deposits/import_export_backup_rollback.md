# PS-040-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-10. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** portability workflow (F07 export), platform backup (F15), operations (rollback), privacy review (F10).

## Purpose and scope
Define the export format, import boundary, backup and restore behavior, and rollback boundaries for deposits. A rollback restores service and never reverses money. Money is outside platform custody, so restoring a database cannot move funds. Corrections go through new transitions or dispute outcomes.

## Requirements
- PS-040-10.R01: Business outcome: a participant can export their own deposit records in a documented format. Operators can restore or roll back the module without leaving orphaned events, duplicate timers or unpublished state. Exclusions: importing deposit records from external systems in v1, and restoring money.
- PS-040-10.R02: Case coverage: export during an open dispute, export after pseudonymization, restore to a point before a timer fired, rollback after a schema migration, partial export interrupted, and restore into a database that already has newer rows.
- PS-040-10.R03: Export and restore operations are auditable (who, when, scope) without personal data in the audit line.
- PS-040-10.R04: Export is free of other participants' private fields. Each party's export includes only deposits where they are a party.
- PS-040-10.R05: Rollback keeps committed events valid. Consumers that already processed an event are not asked to unprocess it.

## Export format
- Format: JSON Lines, UTF-8, one object per line, with envelope `{"export_schema":"deposits.export.v1","record_type":"...","data":{...}}` (A-deposits-27).
- Record types: deposit, deposit_term_revision, deposit_evidence, deposit_event, in that order per deposit.
- Money appears as integer minor units with currency_code.
- Timestamps are UTC RFC 3339 with milliseconds.
- Pseudonymized participant IDs are exported as they are stored. No additional identifiers are added.
- Free text: none exists, so none is exported.

Example line:
`{"export_schema":"deposits.export.v1","record_type":"deposit","data":{"deposit_id":"dep_01JZ8M3QF4T7X2K9R0W5ABCDEF","state":"settled","settlement_outcome":"returned_full","amount_minor":25000,"currency_code":"EUR","revision":6,"schema_version":1}}`

## Export procedure
1. Requester is authenticated; scope is set to the requester's own participant ID.
2. Server streams matching rows in deposit_id order, cursor-based, 500 rows per chunk.
3. Export job is idempotent by (requester, request_id). A repeated request returns the same file reference until it expires.
4. Output file is retained for 7 days, then deleted. Download link expires after 24 hours.
5. Interrupted export resumes from the last chunk cursor; no duplicate lines are produced.
6. Export of a deposit with an open dispute includes the counterparty's own rows only; moderator notes do not exist in v1.

## Import boundary
- No external import of deposit records in v1. Writing rows from files is limited to restore from platform backup.
- Any future import feature requires a new process spec and a schema_version bump.

## Backup and restore
- Platform point-in-time backup covers deposit tables, outbox and timers. Retention 35 days (F15 default, A-deposits-28).
- Restore is into a new database instance, followed by a diff check against the event log. Restored state is authoritative for the restore point.
- Events committed after the restore point are not replayed. Consumers may have seen them; the restored state reflects the restore point and reconciliation reports the gap.
- Timers are re-evaluated after restore. Any timer whose fire_at is past is run under the normal lock and revision rules, not blindly fired.
- Idempotency records older than the restore point are removed to avoid stale replies.

## Rollback boundaries
- Feature flag `deposits_enabled` off: new commands return DEPOSITS_FORBIDDEN_REVOKED with a service-unavailable message key. Queries keep working. Timers keep running so terminal states are reached.
- Code rollback: the previous code must read schema_version 1 and ignore unknown additive fields.
- Schema migration: expand then contract across two releases. No destructive migration ships in the same release as its code change.
- Down migration is forbidden for any table containing settled rows.
- Rollback never reverses a committed transition. Corrections are new transitions (for example, dispute resolution), recorded as new deposit_event rows.

## Assumptions and open decisions
- A-deposits-27: Export format name and envelope are provisional until CTR-SCH-001 is final (F15).
- A-deposits-28: Backup retention of 35 days is the F15 default and not yet confirmed.
- A-deposits-29: Rollback is controlled by the `deposits_enabled` flag. Flag naming is provisional under F15 configuration rules.
- Open: whether exports should include events from a dispute the requester opened, which may contain counterparty-visible data. Working default: yes, counterparty rows excluded.

## Test cases
- TEST-PS-040-10-T01: Export one participant's deposits, parse each line, and check the export_schema value. Pass: every line parses; only that participant's deposits appear. Fail: any line fails to parse or includes another participant's deposit.
- TEST-PS-040-10-T02: Restore a backup taken before a return_confirm timer fired. Pass: timer re-evaluated under lock; no duplicate transition; reconciliation reports the event gap. Fail: duplicate transition or silent gap.
- TEST-PS-040-10-T03: Set deposits_enabled off, then attempt propose. Pass: refused with a service-unavailable message key; timers still reach terminal states. Fail: command accepted or timers stop.
