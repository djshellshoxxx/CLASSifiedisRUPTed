# PS-028-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-10.R01 | Provider exports own windows as JSON (`svcavail.window` 1.0.0) and as ICS (VEVENT per occurrence, no customer data). Export ≤ 2 MB. | MVP |
| PS-028-10.R02 | ICS import is supported (PS-028-02 R07); JSON import is not supported in MVP. | MVP |
| PS-028-10.R03 | Backup restore preserves `revision`, `status`, `hold_expires_at`; on restore, any HELD window whose hold has expired is set to OPEN and an event is emitted. | MVP |
| PS-028-10.R04 | Timezone database version is recorded per window's validation; upgrades do not rewrite stored UTC times. | MVP |
| PS-028-10.R05 | Rollback of a release never edits BOOKED windows. | MVP |

## Data / schema
Export envelope: `{ "schema_id": "svcavail.window.export", "schema_version": "1.0.0", "srv_id", "windows": [...] }`. ICS export contains only UID (opaque, not window ID), DTSTART, DTEND, RRULE.

## Commands / queries / events
Export is a query under `srv.read` (self). Import via `svcavail.import_ics`. Emits `svcavail.window.created` per imported window.

## States & transitions
Restore follows R03 rules; no other state change.

## Validation & errors
Corrupt backup → `SYS.INTERNAL`, restore halted. ICS errors per PS-028-02.

## Authorization
Export: provider only. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup digest. Import all-or-nothing. Offline export is a local file; no sync.

## Privacy, retention, abuse
Export files are PRIVATE_PERSONAL; download link valid 15 min. ICS export keeps TZID on DTSTART (required for correct local time) and contains no customer data. Import rate limit 10 per day per provider.

## Observability & budgets
Restore ≤ 10 min for 1 million windows (ASSUMPTION). Metrics: `svcavail_exports_total{format}`, `svcavail_restore_total{result}`.

## Tests
- TEST-PS-028-10-01 (integration): export → restore round trip; identical UTC times and revisions.
- TEST-PS-028-10-02 (integration): expired hold after restore becomes OPEN with event.
- TEST-PS-028-10-03 (negative): ICS export contains no customer identifier.
- TEST-PS-028-10-04 (regression): timezone database upgrade leaves stored UTC times unchanged.

## Acceptance criteria
1. Round-trip test passes.
2. ICS export audited for personal data: zero customer fields.
3. Rollback runbook has no in-place BOOKED edits.

## Assumptions & open decisions
- ASSUMPTION: 15-minute download link expiry; 10 imports per day.
- PROVISIONAL: D05 and D07 defaults (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
