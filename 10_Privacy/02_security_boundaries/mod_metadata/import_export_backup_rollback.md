# PS-080-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (backups row, R06), CTR-SCH-001 (R07, R08), CTR-FED-001 (R08 export re-keying).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-10.R01 | No import path accepts attachment metadata from external sources; imported attachments pass the same sanitiser. | MVP |
| PS-080-10.R02 | Data exports (F10.S01.M03) include attachments only after sanitisation; original uploads are never exported because they are not stored. | MVP |
| PS-080-10.R03 | Backups contain only `clean` attachments and sanitiser reports; no quarantined bytes. | MVP |
| PS-080-10.R04 | Rollback of a sanitiser version keeps `clean` outputs; new uploads use the restored version. | MVP |
| PS-080-10.R05 | Policy history is retained as versioned config and is restorable with approvals. | MVP |

## Data / schema
Backup manifest flags: `attachments_clean_only: true`, `policy_version`.

## Commands / queries / events
None beyond PS-080-04.

## States & transitions
Restore: `restoring` → `verifying_clean_flags` → `serving`. Any attachment without clean flag is excluded.

## Validation & errors
Restore with unflagged attachment → `META.STRIP_FAILED` (not retryable), attachment excluded and reported.

## Authorization
Restore is operator action with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Verification is idempotent by attachment ID.

## Privacy, retention, abuse
Quarantined files excluded from backups by construction.

## Observability & budgets
`meta_restore_excluded_total`; restore verification ≤ 1 h for 1 M attachments (ASSUMPTION).

## Tests
- TEST-PS-080-10-01 (backup): quarantined file absent from backup.
- TEST-PS-080-10-02 (rollback): sanitiser v-1 restored; existing clean outputs still served; new upload sanitised with v-1.

## Acceptance criteria
1. TEST-PS-080-10-01 and -02 pass.
2. Export path test shows no unsanitised attachment.
3. Restore excludes unflagged attachments (fixture).

## Assumptions & open decisions
- ASSUMPTION: restore budget above.
- PROVISIONAL (D07 default): backup retention per schedule.
