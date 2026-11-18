# PS-105-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-10.R01 | Account export includes all windows for the account in JSON (schema 1.0.0), class PRIVATE_PERSONAL. | MVP |
| PS-105-10.R02 | Import of windows accepts only the export schema and re-runs validation rules PS-105-02; unknown tz is rejected, not coerced. | MVP |
| PS-105-10.R03 | Windows are not federated (no CTR-FED-001 mapping). | MVP |
| PS-105-10.R04 | Rollback: feature flag `hours_gating` off sends all deferred items immediately to their channel only if they are still within 2 h of creation; older items are dropped. | MVP |

## Data / schema
Export: `{ "windows": [ { "channel", "weekdays", "start_min", "end_min", "tz", "updated_at" } ], "schema_version": "1.0.0" }`.

## Commands / queries / events
`account.export` includes this section under `delivery_window.export` (self). Import is a `hours.set_windows` call with `import_source` tag.

## States & transitions
Rollback flag transitions evaluation to pass-through; deferred records follow R04.

## Validation & errors
Import errors use HOURS codes with `details[].field` pointers.

## Authorization
Export self only. Import self only. Rollback requires operator `global` scope with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export repeatable; import idempotent by `import_source` + digest.

## Privacy, retention, abuse
Backups hold windows encrypted per backup policy; restores keep account-scoped access only.

## Observability & budgets
Export of one account ≤ 1 s p95.

## Tests
- TEST-PS-105-10-01 (contract): export validates against schema 1.0.0.
- TEST-PS-105-10-02 (integration): import with `Europe/Berln` (typo) rejected with HOURS.TZ_UNKNOWN.
- TEST-PS-105-10-03 (integration): rollback drops items older than 2 h.
- TEST-PS-105-10-04 (negative): federation peer attempting window import rejected.

## Acceptance criteria
1. Round-trip export and import is lossless for valid data.
2. Rollback behavior verified in staging (not yet run).
3. No window content in backup manifests.

## Assumptions & open decisions
- ASSUMPTION: 2 h rollback window.
- D07 PROVISIONAL (D07 default, unapproved).
