# PS-081-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07), CTR-EVT-001 (R08), CTR-PRV-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-10.R01 | Model export is a signed JSON document with digest, for auditors only. | MVP |
| PS-081-10.R02 | Import of a model is allowed only as a new proposed version; it cannot overwrite an approved version. | MVP |
| PS-081-10.R03 | Rollback re-points "current" to a previous approved version; it creates a new event and deletes nothing. | MVP |

## Data / schema
Export schema `model.export@1.0.0` (PENDING CTR-SCH-001 registration). Fields from [domain_schema.md](domain_schema.md).

## Commands / queries / events
`model.export` (reader), `model.import_proposal` (Privacy Lead), `model.rollback` (Security Lead). Events `model.exported`, `model.rolled_back`.

## States & transitions
Rollback target must be `approved` or `superseded`; never `draft`.

## Validation & errors
| Code | When |
|---|---|
| MODEL.IMPORT_UNSIGNED | import without digest |
| MODEL.ROLLBACK_TARGET_INVALID | target not approved |

## Authorization
Export: `model.read`. Import: Privacy Lead. Rollback: Security Lead, not self-proposed.

## Failure, idempotency, concurrency, offline
Export idempotent per version digest. Rollback idempotent per target version.

## Privacy, retention, abuse
Export contains no personal data (PS-081-07). Backup of the model follows platform schedule.

## Observability & budgets
Metric `model_rollbacks_total`. Export p95 ≤ 2 s (ASSUMPTION).

## Tests
- TEST-PS-081-10-01 (import): unsigned import rejected.
- TEST-PS-081-10-02 (rollback): rollback to superseded version keeps history.
- TEST-PS-081-10-03 (export): exported digest verifies.

## Acceptance criteria
1. Import never overwrites approved versions.
2. Rollback leaves history intact.
3. Export digests verify.

## Assumptions & open decisions
- ASSUMPTION: export latency budget.
- PROVISIONAL (D10 default, unapproved): signed export keys are user-independent platform keys (OPEN, F16).
