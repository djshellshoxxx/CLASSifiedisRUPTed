# PS-104-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-10.R01 | Account export includes subscription metadata (device label, status, created_at) and excludes `endpoint`, `p256dh` and `auth`. | MVP |
| PS-104-10.R02 | Push subscriptions are never imported from another node or from a backup into an active state; restored rows are set `expired` and must re-register. | MVP |
| PS-104-10.R03 | Backups encrypt SECRET fields with a key managed by F16; backup restore cannot decrypt keys without the F16 key record. | MVP |
| PS-104-10.R04 | Rollback = feature flag off: dispatch stops, queue is retained for 24 h then expired; no schema rollback required for 1.0.0. | MVP |

## Data / schema
Export file schema (JSON, `schema_version` 1.0.0): `{ "subscriptions": [ { "psb_id", "device_label", "status", "created_at" } ] }`. Export class PSEUDONYMOUS.

Federation export of push records: not in scope (no `psb_` in CTR-FED-001 envelope; Future).

## Commands / queries / events
- `account.export` includes this module's export section under capability `push_subscription.export` (self).
- Restore emits `push_subscription.expired` with `reason_code` `RESTORED_UNVERIFIED` for each restored row.

## States & transitions
Restore: `active` in backup becomes `expired` on restore. Rollback: queued attempts become `expired` after 24 h.

## Validation & errors
Import of any push subscription file returns `PUSH.IMPORT_NOT_SUPPORTED` (non-retryable).

## Authorization
Export only by self (`push_subscription.export`); restore requires operator `global` scope and dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export is repeatable and read-only. Restore is idempotent per `psb_id`. Rollback does not delete rows.

## Privacy, retention, abuse
Backup retention follows the backup policy in the platform backup spec (15_Platform/03_operations/mod_backups). Export deletes nothing.

## Observability & budgets
Export of 10 subscriptions completes in ≤ 2 s p95. Restore job reports count of rows set to `expired`.

## Tests
- TEST-PS-104-10-01 (contract): export file contains no key or endpoint fields.
- TEST-PS-104-10-02 (integration): restore from backup yields zero `active` push subscriptions.
- TEST-PS-104-10-03 (integration): feature flag off stops sends within 60 s and keeps queue rows until 24 h.
- TEST-PS-104-10-04 (negative): push subscription import file is rejected with `PUSH.IMPORT_NOT_SUPPORTED`.

## Acceptance criteria
1. Export and restore behavior verified in staging (not claimed as done).
2. No key material in any export or backup manifest.
3. Rollback runbook names the flag and the 24 h queue window.

## Assumptions & open decisions
- ASSUMPTION: federation push delivery is not in MVP.
- Retention: D07 default, PROVISIONAL (D07 default, unapproved).
- Backup key management depends on D10 (PROVISIONAL default, unapproved).
