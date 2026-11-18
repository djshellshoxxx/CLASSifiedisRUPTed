# PS-122-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-10.R01 | Restore is the only import path; it reads only `complete` backup sets (PS-120). | MVP |
| PS-122-10.R02 | No export of restored data outside the isolated target. Export of restored owner data goes through PS-122 R04 gate and owner export rules (CTR-PRV-001 R11). | MVP |
| PS-122-10.R03 | Rollback before promotion: `abort`, destroy isolated data (PS-122-07 R03). Rollback after promotion is a new restore run from an earlier backup, with the same approvals. | MVP |
| PS-122-10.R04 | Runbook rollback steps are rehearsed in each quarterly drill. | MVP |
| PS-122-10.R05 | Signed evidence (CTR-COM-001 claims) keeps original bytes; no lossy projection (CTR-SCH-001 R08). | MVP |

## Data / schema
Runbook artifact: `runbook.v<SemVer>.json` with step list, owner role, rollback step, digest.

## Commands / queries / events
Rollback after promotion is a new `restore_run.create`.

## States & transitions
`promoted` → new run (PS-122-03).

## Validation & errors
`RECOVERY.RUNBOOK_NOT_ACTIVE` for rollback runbook not active.

## Authorization
Rollback after promotion needs the same two approvals as the original restore.

## Failure, idempotency, concurrency, offline
Abort is idempotent on run ID.

## Privacy, retention, abuse
Runbook artifacts contain no record content or secrets.

## Observability & budgets
Time from decision to rollback complete measured in drills.

## Tests
- TEST-PS-122-10-01 (negative): restore from a non-complete set refused.
- TEST-PS-122-10-02 (rollback): abort before promotion destroys isolated data.
- TEST-PS-122-10-03 (rollback): post-promotion rollback creates new approved run.
- TEST-PS-122-10-04 (evidence): claim bytes identical after restore.

## Acceptance criteria
1. Rollback procedures rehearsed in drill (TEST-03).
2. TEST-PS-122-10-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D07 default).
