# PS-138-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-10.R01 | Experiment definitions are versioned in the repository; changes require review. | MVP |
| PS-138-10.R02 | Results export contains verdicts and metrics, not raw telemetry payloads. | MVP |
| PS-138-10.R03 | Rollback of an experiment definition is a new commit; history kept. | MVP |
| PS-138-10.R04 | Experiment records are not restored into running state after backup restore; they are marked `aborted`. | MVP |

## Data / schema
Export: `experiment_id`, `version`, `verdict`, `metric_summary`.

## Commands / queries / events
N/A beyond registry operations.

## States & transitions
Restore marks `running` as `aborted`.

## Validation & errors
N/A.

## Authorization
Export requires `chaos_experiment.approve` role (read).

## Failure, idempotency, concurrency, offline
Restore idempotent by `experiment_id`.

## Privacy, retention, abuse
Exports exclude target hostnames.

## Observability & budgets
Counter `chaos_export_total`.

## Tests
- TEST-PS-138-10-01: restore marks running experiment aborted.
- TEST-PS-138-10-02: export excludes hostnames.

## Acceptance criteria
1. No experiment resumes after restore.
2. Export passes hostname lint.

## Assumptions & open decisions
- ASSUMPTION: 'aborted' on restore.
- D07 (archive retention): PROVISIONAL (D07 default, unapproved).
