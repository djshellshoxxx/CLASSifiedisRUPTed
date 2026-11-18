# PS-139-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-FED-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-10.R01 | Workload and profile definitions are versioned in the repository; rollback is a new commit. | MVP |
| PS-139-10.R02 | Baseline results are exported as summaries (percentiles, counts), not raw traces. | MVP |
| PS-139-10.R03 | Restoring a baseline does not start any run. | MVP |
| PS-139-10.R04 | Baselines are tied to a build line and environment ID; cross-environment comparison is refused. | MVP |

## Data / schema
Export: `baseline_id`, `build_line`, `environment_id`, `percentiles`, `error_rate`.

## Commands / queries / events
N/A beyond registry operations.

## States & transitions
N/A.

## Validation & errors
Cross-environment comparison: `LOAD.BASELINE_MISMATCH` (validation 400).

## Authorization
Export requires `load_run.read`.

## Failure, idempotency, concurrency, offline
Import idempotent by `baseline_id`.

## Privacy, retention, abuse
Summaries contain no personal data.

## Observability & budgets
Counter `load_baseline_import_total{result}`.

## Tests
- TEST-PS-139-10-01: restore does not start a run.
- TEST-PS-139-10-02: cross-environment comparison refused.

## Acceptance criteria
1. Zero runs started by restore in fixtures.
2. Cross-environment comparisons refused in 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: baselines per build line.
- D07 (summary retention): PROVISIONAL (D07 default, unapproved).
