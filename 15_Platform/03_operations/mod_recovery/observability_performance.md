# PS-122-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-08.R01 | Per-step timers: `restore_step_duration_seconds{step}`. | MVP |
| PS-122-08.R02 | Drill result metrics: `drill_rto_seconds`, `drill_rpo_seconds`, `drill_checks_failed_total`. | MVP |
| PS-122-08.R03 | Targets: RTO <= 4 h, RPO <= 15 min for the reference dataset (ASSUMPTION). | MVP |
| PS-122-08.R04 | Quarterly full drill and monthly partial drill (ASSUMPTION; BT-06 review cadence). | MVP |
| PS-122-08.R05 | Dashboards show drill results and last-run status; no record content. | MVP |

## Data / schema
Labels: `step` enum from PS-122-03.

## Commands / queries / events
`drill_record.create` (PS-122-04).

## States & transitions
Not applicable.

## Validation & errors
Missing drill schedule raises an alert, not an error.

## Authorization
`drill_record.read` for `ope` (PS-122-05).

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Metrics contain no identifiers.

## Observability & budgets
Budgets in R03.

## Tests
- TEST-PS-122-08-01 (unit): RTO and RPO computed from timestamps match recorded values.
- TEST-PS-122-08-02 (drill): quarterly drill meets R03 targets in staging.
- TEST-PS-122-08-03 (alert): skipped monthly drill alerts within 1 day.
- TEST-PS-122-08-04 (log scan): no record identifiers beyond run ID.

## Acceptance criteria
1. Drill results published each quarter (TEST-02).
2. TEST-PS-122-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: RTO 4 h and RPO 15 min are targets; not commitments until measured.
