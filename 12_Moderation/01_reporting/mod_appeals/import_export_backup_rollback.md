# PS-092-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11, R12), CTR-EVT-001 (R08), CTR-CAP-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-10.R01 | Appeals are not importable from other nodes or other systems in MVP. | MVP |
| PS-092-10.R02 | Owner export (appellant's own appeals) includes `apl_` rows, state history and body, but not reviewer IDs (CTR-PRV-001 R11). | MVP |
| PS-092-10.R03 | Operator export of appeals is case-scoped with dual control; body excluded by default. | MVP |
| PS-092-10.R04 | Backups are encrypted; restore replays `apl_event` in revision order and verifies per-appeal revision continuity. | MVP |
| PS-092-10.R05 | No rollback command. A wrongly applied decision is corrected by a new `appeal.decided` event and a new enforcement action. | MVP |

## Data / schema
Owner export: JSON, schema_version header, one object per appeal with events array; maximum 1 000 appeals per file. Operator export: JSON Lines, IDs and codes only.

## Commands / queries / events
Export commands: `appeal.export_owner` (`apl.read` self), `appeal.export_case` (`apl.export`, dual control) → `appeal.exported` event with count and digest.

## States & transitions
Restore inserts historical rows without re-running transitions, then runs a continuity check. Restored appeals in `decided` without `implemented` enter the backlog (PS-092-06 R05).

## Validation & errors
Export over 1 000 owner rows → `APPEALS.EXPORT_TOO_LARGE` (validation, non-retryable; use cursor). Restore with revision gap → restore aborted, operator alert.

## Authorization
Owner export: appellant only. Case export: dual control.

## Failure, idempotency, concurrency, offline
Export jobs idempotent by `export_id`; partial export deleted on failure. Restore is idempotent by backup ID.

## Privacy, retention, abuse
Exports expire after 7 days. Owner export redacts reviewer IDs and reporter data (none stored). Legal-hold appeals excluded from owner deletion until hold release.

## Observability & budgets
Restore ≤ 30 min per 100 000 appeals (ASSUMPTION). Backup success metric `appeals_backup_last_success_timestamp`.

## Tests
- `TEST-PS-092-10-01` integration: backup → delete → restore → state and revision equal.
- `TEST-PS-092-10-02` negative: owner export excludes reviewer IDs.
- `TEST-PS-092-10-03` negative: case export without dual control → denied, `dec_` written.
- `TEST-PS-092-10-04` drill: restore with injected revision gap → restore aborted, no partial data visible.

## Acceptance criteria
1. Restore reproduces all appeals and events in test.
2. Owner export includes the appellant's body and excludes reviewer identity.
3. No rollback path exists in code (review gate).

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15 operations.
- D07 (retention), PROVISIONAL default: legal-hold exceptions for backups (unapproved).
