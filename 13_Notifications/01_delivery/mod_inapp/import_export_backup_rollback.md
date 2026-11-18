# PS-103-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11, R12), CTR-EVT-001 (R08), CTR-SCH-001 (template and schema migration).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-10.R01 | In-app notifications are not importable or exportable to other nodes or products. | MVP |
| PS-103-10.R02 | Owner export includes the owner's notifications (template keys, timestamps, states) without parameter values beyond labels the owner already sees. | MVP |
| PS-103-10.R03 | Backups are encrypted; restore reproduces inbox states and revisions; expired `params` are not restored. | MVP |
| PS-103-10.R04 | Template changes follow CTR-SCH-001: a new template version never changes the meaning of an existing key; rendering fallback is defined for retired keys. | MVP |
| PS-103-10.R05 | No rollback command for notifications; corrections are new notifications. | MVP |

## Data / schema
Owner export: JSON, one object per notification, ≤ 1 000 per file, expires after 7 days. Backup scope: rows within retention windows (PS-103-07).

## Commands / queries / events
`inbox.export_owner` (acc_, self) → `inbox.exported` with count and digest only.

## States & transitions
Restore inserts historical rows and sets `inbox_revision` continuity; no events re-emitted.

## Validation & errors
Export over 1 000 items → `INAPP.EXPORT_TOO_LARGE` (400, non-retryable; cursor). Restore revision gap → restore aborted, alert.

## Authorization
Owner only.

## Failure, idempotency, concurrency, offline
Export idempotent by `export_id`; restore idempotent by backup ID; dead-letter rows are included in restore for replay by the owning producer (PS-103-06 R03).

## Privacy, retention, abuse
Owner export excludes operation logs and dead-letter rows (operational, not owner data).

## Observability & budgets
Restore ≤ 30 min per 100 000 items (ASSUMPTION). Metric `inapp_backup_last_success_timestamp`.

## Tests
- `TEST-PS-103-10-01` integration: backup → delete → restore → states and revisions equal.
- `TEST-PS-103-10-02` negative: owner export excludes operation logs.
- `TEST-PS-103-10-03` negative: notification import from peer refused.
- `TEST-PS-103-10-04` migration: retired template key renders via fallback in restored inbox.

## Acceptance criteria
1. Restore reproduces inbox states and revisions in test.
2. Owner export contains no content beyond owner-visible labels.
3. Template migration fallback verified.

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15.
- D07 (retention), PROVISIONAL default: PS-103-07 windows apply to backups (unapproved).
