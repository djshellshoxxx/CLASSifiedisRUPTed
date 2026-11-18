# PS-079-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (retention classes RET-*, R06, R07), CTR-SCH-001 (R01, R10), CTR-ID-001 (`cas_` for holds, `aud_` for audit), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-01.R01 | Exactly one `retention_policy` row per (`retention_class`, `version`). `retention_class` is one of the ten RET-* values in CTR-PRV-001 (RET-EPH, RET-OPS, RET-AUD, RET-ACC, RET-PRIV, RET-LOC, RET-EVD, RET-SEC, RET-FED, RET-LEGAL). | MVP |
| PS-079-01.R02 | Each registered schema field maps to exactly one retention class via CTR-SCH-001 registry; unmapped field fails CI. | MVP |
| PS-079-01.R03 | `retention_hold` rows reference one `cas_` ID, a selector (`record_type`, `subject_acc_id` or `case_scope`), `applied_at`, `ends_at` and two distinct approver IDs. | MVP |
| PS-079-01.R04 | `ends_at` is mandatory and ≤ `applied_at` + 365 days (ASSUMPTION). | MVP |
| PS-079-01.R05 | Published policy rows are immutable; changes create a new version. | MVP |

## Data / schema
```json
{
  "retention_policy": {"retention_class": "RET-PRIV", "version": "1.0.0", "max_duration": "P365D", "effective_from": "timestamp", "approved_by": ["ope_<ULID>", "ope_<ULID>"], "data_class_scope": ["PRIVATE_PERSONAL"]},
  "retention_hold": {"id": "cas_<ULID>", "selector": {"record_type": "string", "subject_acc_id": "acc_<ULID> | null"}, "applied_at": "timestamp", "ends_at": "timestamp", "approvers": ["ope_<ULID>", "ope_<ULID>"], "state": "applied | released | auto_released"}
}
```
Duration values are ISO 8601. Legal period values are PENDING jurisdiction review (R07).

## Commands / queries / events
See PS-079-04.

## States & transitions
See PS-079-03.

## Validation & errors
See PS-079-02.

## Authorization
Policy rows and holds are administered only through capabilities in PS-079-05.

## Failure, idempotency, concurrency, offline
Policy publish is idempotent on (class, version). Hold application is idempotent on `cas_` plus selector digest.

## Privacy, retention, abuse
Policy rows: RET-AUD. Hold rows: RET-LEGAL while active, then RET-AUD. Holds store no content.

## Observability & budgets
`retention_holds_active` gauge; row write p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-079-01-01 (lint): every registered field maps to one class (CTR-PRV-001 R01).
- TEST-PS-079-01-02 (schema): hold without two distinct approvers is rejected at storage level.

## Acceptance criteria
1. Policy table covers all ten RET-* classes.
2. No unmapped field passes CI.
3. Hold row cannot be inserted without `ends_at`.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- ASSUMPTION: 365-day maximum hold without re-approval.
- OPEN (R07): legal periods for RET-EVD and RET-LEGAL.
