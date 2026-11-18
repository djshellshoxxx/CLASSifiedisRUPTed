# PS-100-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-EVT-001 (R08), CTR-SCH-001 (model and schema migration).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-10.R01 | Assessments are not importable from or exportable to other nodes or products. | MVP |
| PS-100-10.R02 | Subject export (PS-100-07 R03) contains category codes and review outcomes only, not tiers or weights. | MVP |
| PS-100-10.R03 | Backups are encrypted; restore reproduces assessments within retention and holds; expired assessments are not restored. | MVP |
| PS-100-10.R04 | Model artifacts are versioned and signed; rollback = re-deploy a prior signed model version; existing assessments keep their `model_version`. | MVP |
| PS-100-10.R05 | Restore reconciles holds with case state; any hold without an open case is released with an audit record. | MVP |

## Data / schema
Subject export: JSON, category codes and review outcomes, ≤ 100 items per export. Backup scope: assessments within retention and open holds.

## Commands / queries / events
`risk.export_subject` (subject's own) → `risk.exported` with count and digest.

## States & transitions
Restore does not replay transitions; restored holds are re-applied to discovery after reconciliation.

## Validation & errors
Export over 100 items → `RISK.EXPORT_TOO_LARGE` (400, non-retryable; cursor). Reconciliation mismatch → restore aborted, alert.

## Authorization
Subject export: subject only. Operator access: case scope with dual control.

## Failure, idempotency, concurrency, offline
Exports idempotent by `export_id`. Restore idempotent by backup ID.

## Privacy, retention, abuse
Exports exclude `signal_refs` and `feature_hash`. Backup restore honors the 30-day and 6-month retention windows (PS-100-07).

## Observability & budgets
Restore ≤ 30 min per 100 000 assessments (ASSUMPTION). Metric `risk_backup_last_success_timestamp`.

## Tests
- `TEST-PS-100-10-01` integration: backup → delete → restore → holds reconciled with cases.
- `TEST-PS-100-10-02` negative: subject export contains no tier and no signal refs.
- `TEST-PS-100-10-03` negative: import of assessments from peer refused.
- `TEST-PS-100-10-04` rollback: prior model version re-deployed; old assessments keep their version label.

## Acceptance criteria
1. Restore reproduces holds and case links in test.
2. Subject export contains no tier or signal references.
3. Model rollback verified.

## Assumptions & open decisions
- ASSUMPTION: RPO ≤ 15 min and RTO ≤ 4 h are shared defaults with F15.
- D07 (retention), PROVISIONAL default: retention windows apply to backups (unapproved).
