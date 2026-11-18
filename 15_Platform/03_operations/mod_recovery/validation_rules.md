# PS-122-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-02.R01 | Restore to `production` is refused unless the target has been through an `isolated` run that reached `read_only` and passed all digest checks. | MVP |
| PS-122-02.R02 | Source backup must be `complete`, not expired except under a hold active before expiry (PS-120-03 R02). | MVP |
| PS-122-02.R03 | Manifest schema version must be supported by the reader (CTR-SCH-001 R06). | MVP |
| PS-122-02.R04 | Runbook version must be `active` in the registry; a `draft` runbook cannot run. | MVP |
| PS-122-02.R05 | Target environment must be on the approved list; production target requires `change_ref` of type `change`. | MVP |

## Data / schema
Rules apply to `restore_run.create` input and to the manifest read at start.

## Commands / queries / events
Applied at `restore_run.create` and `restore_run.approve`.

## States & transitions
Validation failure at creation creates no run.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| RECOVERY.ISOLATION_NOT_PROVEN | false | unprocessable_state / 422 | R01 |
| RECOVERY.SOURCE_NOT_RESTORABLE | false | unprocessable_state / 422 | R02 |
| SCH.UNKNOWN_VERSION | false | validation / 400 | R03 (shared code) |
| RECOVERY.RUNBOOK_NOT_ACTIVE | false | precondition_failed / 412 | R04 |
| RECOVERY.TARGET_NOT_APPROVED | false | forbidden / 403 | R05 |

## Authorization
Validation runs before authorization decisions are recorded; denial still audited.

## Failure, idempotency, concurrency, offline
Validation is deterministic.

## Privacy, retention, abuse
Errors name the rule, not the environment secrets or hostnames.

## Observability & budgets
Metric: `recovery_validation_refused_total{code}`.

## Tests
- TEST-PS-122-02-01 (unit): each rule pass and fail fixture.
- TEST-PS-122-02-02 (negative): production restore without prior isolated run refused.
- TEST-PS-122-02-03 (negative): expired backup without hold refused.
- TEST-PS-122-02-04 (integration): draft runbook refused.

## Acceptance criteria
1. No production restore possible without isolated proof (TEST-02).
2. TEST-PS-122-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: change ticket system reference format defined by F16 incident process (OPEN).
