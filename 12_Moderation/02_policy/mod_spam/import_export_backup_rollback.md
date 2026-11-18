# PS-097-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11), CTR-EVT-001 (R08), CTR-SCH-001 (migration), CTR-FED-001 (R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-10.R01 | Verdicts and classifier model artifacts are not importable from other nodes. Model artifacts are deployed through the release process only. | MVP |
| PS-097-10.R02 | Owner export: an author may export their own subject status history (state and generic category), not features. | MVP |
| PS-097-10.R03 | Backups exclude `feature_hash` values older than the current rotation key, consistent with PS-097-07 R03. | MVP |
| PS-097-10.R04 | Model rollback is supported by pinning `model_version`; rollback does not rewrite verdicts. | MVP |
| PS-097-10.R05 | No rollback command for verdicts; corrections are release or reject actions (PS-097-04). | MVP |

## Data / schema
Owner export: JSON, one object per own subject: `subject_type`, `subject_ref`, state history with timestamps, generic category. Maximum 1 000 subjects per export.

## Commands / queries / events
`spam.export_owner` (author, own subjects) → `spam.exported` with count and digest only.

## States & transitions
Restore inserts historical verdicts without re-emitting transitions; expired quarantines are re-evaluated by the expiry job.

## Validation & errors
Export over 1 000 subjects → `SPAM.EXPORT_TOO_LARGE` (400, non-retryable; use cursor; registry row in PS-097-02).

## Authorization
Owner export: author only.

## Failure, idempotency, concurrency, offline
Exports idempotent by `export_id`. Restore idempotent by backup ID.

## Privacy, retention, abuse
Owner export excludes reason detail beyond generic category, so it cannot be used to probe rules (PS-097-07 abuse 2).

## Observability & budgets
Restore ≤ 30 min per 100 000 verdicts (ASSUMPTION). Metric `spam_backup_last_success_timestamp`.

## Tests
- `TEST-PS-097-10-01` integration: backup → delete → restore → states equal; no re-emitted events.
- `TEST-PS-097-10-02` negative: owner export contains no feature fields.
- `TEST-PS-097-10-03` negative: model import attempt from peer → refused.
- `TEST-PS-097-10-04` rollback: pinned model version reproduces prior decisions on the fixture set.

## Acceptance criteria
1. Restore reproduces verdict states in test.
2. Owner export has zero feature fields.
3. Model rollback path tested.

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15.
- D07 (retention), PROVISIONAL default: retention windows from PS-097-07 apply to backups (unapproved).
