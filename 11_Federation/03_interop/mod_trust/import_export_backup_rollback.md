# PS-091-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R01, R03), CTR-PRV-001 (R06, R07, R12), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-10.R01 | Trust state is never imported from another node. A peer list import creates rows only in `pending`. | MVP |
| PS-091-10.R02 | Operator export of `trs_` for one peer is a privileged export: case scope, dual control, `aud_` record. | MVP |
| PS-091-10.R03 | Backups include `fed_peer_trust` and `trs_` encrypted; restore rebuilds `fed_peer_trust` from `trs_` and verifies revisions (PS-091-06 R05). | MVP |
| PS-091-10.R04 | RPO ≤ 15 min and RTO ≤ 4 h for this module's tables (ASSUMPTION). | MVP |
| PS-091-10.R05 | No rollback command exists. Corrections are new transitions (CTR-EVT-001 R08). | MVP |

## Data / schema
Export file: JSON Lines, one `trs_` row per line, fields as PS-091-01, ISO 8601 UTC timestamps, schema_version header line. Maximum 10 000 rows per export.

## Commands / queries / events
Export request: `trs.export` (capability `fpr.administer`, resource `case:cas_`) → `trs.exported` event with row count and digest (no rows in event).

## States & transitions
Import and restore do not run the transition table; they insert historical rows only, verified by hash chain (CTR-EVT-001 R08). Restored peers are placed in their recorded state only after reconciliation passes.

## Validation & errors
Import rejects any row with `trust_state` `trusted` as `TRUST.TRANSITION_NOT_ALLOWED`. Export of more than 10 000 rows → `TRUST.EXPORT_TOO_LARGE` (validation, non-retryable; split by cursor).

## Authorization
Export and restore need `ope_` dual control and case scope.

## Failure, idempotency, concurrency, offline
Restore is idempotent by backup ID. If reconciliation fails after restore, all restored peers are set to `quarantined` pending review (safe default, ASSUMPTION) and `TRUST.REVISION_DRIFT` is raised.

## Privacy, retention, abuse
Exports carry the same classes as the live data. Peer-facing exports are not produced. Exports are encrypted at rest and expire after 7 days.

## Observability & budgets
Restore duration ≤ 30 min for 100 000 rows (ASSUMPTION). Backup job success tracked as `trust_backup_last_success_timestamp`.

## Tests
- `TEST-PS-091-10-01` integration: backup, delete DB, restore → revisions match and states identical.
- `TEST-PS-091-10-02` negative: import file containing `trusted` rows → rejected.
- `TEST-PS-091-10-03` negative: export without dual control → denied and `dec_` recorded.
- `TEST-PS-091-10-04` drill: restore into staging with forced drift → peers quarantined, alert raised.

## Acceptance criteria
1. Restore reproduces the pre-backup state for 100 % of test peers.
2. No import path can create a `trusted` peer.
3. RPO and RTO measured in drill and recorded.

## Assumptions & open decisions
- ASSUMPTION: RPO/RTO values are defaults pending F15 operations review.
- D07 (retention), PROVISIONAL default: legal-hold exceptions apply to backups (unapproved).
- D10 (auth and portability), PROVISIONAL default: restored nodes rotate keys if drift is found (unapproved).
