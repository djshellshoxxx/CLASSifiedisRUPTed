# PS-082-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-10.R01 | Register export is restricted: reviewers only, signed, watermarked with export ID. | MVP |
| PS-082-10.R02 | Import creates threats only in `identified` state and requires PS-082-02 validation. | MVP |
| PS-082-10.R03 | Rollback of a threat revision re-points to a prior revision; no revision is deleted. | MVP |

## Data / schema
Export `threat.export@1.0.0` (PENDING registration). Fields per [domain_schema.md](domain_schema.md).

## Commands / queries / events
`threat.export`, `threat.import`, `threat.rollback`. Events `threat.exported`, `threat.imported`, `threat.rolled_back`.

## States & transitions
Import cannot set `mitigated` or `closed` directly.

## Validation & errors
| Code | When |
|---|---|
| THREAT.IMPORT_STATE_FORBIDDEN | import sets non-`identified` state |
| THREAT.ROLLBACK_TARGET_INVALID | target revision not found |

## Authorization
Export: reviewers with `threat.read`. Import: Security Lead. Rollback: two approvers.

## Failure, idempotency, concurrency, offline
Export idempotent per request ID. Import idempotent per `threat_id` + digest.

## Privacy, retention, abuse
Exports carry restricted watermark; audit record per export.

## Observability & budgets
Metric `threat_exports_total`; export p95 ≤ 5 s for 500 threats (ASSUMPTION).

## Tests
- TEST-PS-082-10-01 (import): import in `mitigated` state rejected.
- TEST-PS-082-10-02 (export): non-reviewer export refused.
- TEST-PS-082-10-03 (rollback): prior revision restored; history intact.

## Acceptance criteria
1. Import cannot skip states.
2. Export restricted and audited.
3. Rollback keeps history.

## Assumptions & open decisions
- ASSUMPTION: export budget.
- PROVISIONAL (D10 default, unapproved): signed exports use reviewer-held keys.
