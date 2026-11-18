# PS-055-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-10.R01 | Bundle schema changes: additive MINOR; removal = MAJOR with a reader for the old MAJOR for 12 months (ASSUMPTION). | MVP |
| PS-055-10.R02 | Imported profiles receive a new `prf_` ID and `imported_from` provenance (bundle_digest prefix). Source IDs are not reused. | MVP |
| PS-055-10.R03 | Backups include `bnd_` metadata and `imj_` rows; bundle files are excluded from backups (RET-EPH). | MVP |
| PS-055-10.R04 | Restore replays deletions of profile fields before serving imported profiles (CTR-PRV-001 R06). | MVP |
| PS-055-10.R05 | Feature-flag rollback disables new exports and imports; staged imports are rejected with a clear code, not silently applied. | MVP |

## Data / schema
`imported_from` = `{bundle_digest_prefix: hex8, imported_at: RFC3339}`.

## Commands / queries / events
Bundle export and import are the module's own interchange; no other export path is defined.

## States & transitions
Restore and rollback effects per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Rolled-back feature returns `SYS.UNPROCESSABLE_STATE` (422) with `feature_disabled`.

## Authorization
Owner step-up required for both directions.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup snapshot ID.

## Privacy, retention, abuse
Backups keep bundle metadata for 12 months only.

## Observability & budgets
Restore report: counts of imported profiles and replayed deletions.

## Tests
TEST-PS-055-21 (old-MINOR bundle reads), TEST-PS-055-22 (restore replays deletion), TEST-PS-055-23 (flag rollback rejects staged imports).

## Acceptance criteria
1. Golden fixture for every supported MINOR imports correctly.
2. No backup contains a bundle file.

## Assumptions & open decisions
- ASSUMPTION: 12-month reader window.
- PROVISIONAL (D07 default, unapproved).
