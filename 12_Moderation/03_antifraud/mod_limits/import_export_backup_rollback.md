# PS-098-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (migration and compatibility), CTR-PRV-001 (R06, R11), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-10.R01 | Policies are not importable from other nodes or other products in MVP. | MVP |
| PS-098-10.R02 | Export of active and retired policy values (public classes) is available to operators; decision records are operator-only. | MVP |
| PS-098-10.R03 | Backups are encrypted; restore reproduces policy versions and active pointers; restore does not change `dec_` records. | MVP |
| PS-098-10.R04 | Schema migrations for `lim_policy` follow CTR-SCH-001 (expand, backfill, contract) with a compatibility window of one MINOR version. | MVP |
| PS-098-10.R05 | Rollback of a policy is a new activation of an earlier version's values as a new version, never an edit of history. | MVP |

## Data / schema
Operator export: JSON Lines of policy rows (no decisions), ≤ 10 000 rows per file. Decision export is a separate case-scoped export with dual control (not in this module's MVP scope beyond PS-098-07).

## Commands / queries / events
`limits.export_policies` (`lim.read`, operator) → `limits.exported` with count and digest.

## States & transitions
Restore does not replay rollout steps; restored active policies keep their recorded rollout percent.

## Validation & errors
Export over limit → `LIMITS.EXPORT_TOO_LARGE` (400, non-retryable; use cursor). Restore with active pointer mismatch → restore aborted, alert.

## Authorization
Operator export only; owners do not export policy history.

## Failure, idempotency, concurrency, offline
Exports idempotent by `export_id`. Restore idempotent by backup ID.

## Privacy, retention, abuse
Policy exports exclude `created_by` and `approved_by` identifiers (operator pseudonyms), so exports cannot be used to attribute policies to staff.

## Observability & budgets
Restore ≤ 15 min for 10 000 policies (ASSUMPTION). Metric `limits_backup_last_success_timestamp`.

## Tests
- `TEST-PS-098-10-01` integration: backup → delete → restore → active pointers and versions equal.
- `TEST-PS-098-10-02` negative: export excludes approver identifiers.
- `TEST-PS-098-10-03` migration: expand-backfill-contract on a staging copy with two compatible versions.
- `TEST-PS-098-10-04` drill: active pointer mismatch aborts restore.

## Acceptance criteria
1. Restore reproduces policy state exactly in test.
2. Export has no staff identifiers.
3. Migration path tested against CTR-SCH-001.

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15.
- D07 (retention), PROVISIONAL default applies to retired policy history (unapproved).
