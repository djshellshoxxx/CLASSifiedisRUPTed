# PS-120-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-10.R01 | Backup sets are not exported outside the platform boundary. Export to a third party is refused (`BACKUP.DESTINATION_NOT_APPROVED`). | MVP |
| PS-120-10.R02 | Import into the platform happens only through restore (PS-122) into an isolated environment. | MVP |
| PS-120-10.R03 | Manifest format changes follow CTR-SCH-001; old manifests stay readable for the supported window (365 days for signed schemas, ASSUMPTION). | MVP |
| PS-120-10.R04 | Rollback of a failed or cancelled job deletes its partial objects and keeps the failure record. Completed sets are never modified. | MVP |
| PS-120-10.R05 | Lossy manifest migration is forbidden; original bytes are kept (CTR-SCH-001 R08). | MVP |
| PS-120-10.R06 | A backup of a schema version is restorable only if the matching migration fixtures exist (CTR-SCH-001 R09). | MVP |

## Data / schema
`backup.manifest` registry entry: owner F15, `signed: false`, `federated: false`, data classes per field.

## Commands / queries / events
No export command. Rollback is `backup.run` abort (internal) with `backup.failed`.

## States & transitions
Rollback path: `running` → `failed` → `purged` (after 24 h) per PS-120-03.

## Validation & errors
`SCH.UNKNOWN_VERSION` on manifests newer than the reader; `SCH.MIGRATION_FAILED` quarantines the set for review.

## Authorization
Export refusal is the default (PS-120-05 R01).

## Failure, idempotency, concurrency, offline
Rollback is idempotent on `bkp_id`.

## Privacy, retention, abuse
Export refusal is logged as a security event (abuse signal).

## Observability & budgets
Metric: `backup_export_refused_total`. Alert on any attempt.

## Tests
- TEST-PS-120-10-01 (negative): export attempt to unapproved destination refused.
- TEST-PS-120-10-02 (migration golden): manifest 1.0 readable under 1.1 reader.
- TEST-PS-120-10-03 (rollback): cancelled job leaves no partial objects after 24 h cleanup.
- TEST-PS-120-10-04 (integrity): completed set bytes unchanged after cleanup of a later failed job.

## Acceptance criteria
1. No export path exists (static route scan).
2. TEST-PS-120-10-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 365-day manifest readability window.
- PROVISIONAL (D07 default).
