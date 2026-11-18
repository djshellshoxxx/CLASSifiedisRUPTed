# PS-135-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-03.R01 | A run is in exactly one state: `queued`, `running`, `pass`, `fail`, `skipped`, `flaky_quarantined`. | MVP |
| PS-135-03.R02 | A scenario that fails 2 of 3 retries is `fail`; a scenario that passes on retry 2 or 3 is `flaky_quarantined`. | MVP |
| PS-135-03.R03 | A quarantined scenario blocks merge until QA Lead clears it within 5 working days (ASSUMPTION). | MVP |
| PS-135-03.R04 | `pass`, `fail` and `skipped` are terminal for a `run_id`. | MVP |

## Data / schema
`outcome` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Transitions emitted as `integration_run.<past-tense>` events.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | schedule | scenario enabled | queued | emit `integration_run.queued` |
| queued | start | environment ready | running | emit `integration_run.started` |
| queued | skip | scenario marked skipped with reason | skipped | emit `integration_run.skipped` |
| running | assertion pass | all assertions pass | pass | emit `integration_run.passed` |
| running | assertion fail | retries exhausted | fail | emit `integration_run.failed` |
| running | assertion fail then pass | retry index 2 or 3 passes | flaky_quarantined | emit `integration_run.flaky_quarantined` |
| flaky_quarantined | clear | QA Lead decision recorded | pass | emit `integration_run.cleared` |

## Validation & errors
Invalid transitions are internal errors and fail the pipeline.

## Authorization
Clearing a quarantine needs QA Lead (F17) capability.

## Failure, idempotency, concurrency, offline
Runs are not resumed after environment loss; a new run is scheduled.

## Privacy, retention, abuse
No personal data in run records.

## Observability & budgets
Metric `integration_flaky_quarantined_total{scenario}`.

## Tests
- TEST-PS-135-03-01: unit, every transition.
- TEST-PS-135-03-02: integration, retry policy produces the expected state.

## Acceptance criteria
1. No quarantined scenario merges without clearance.
2. Retry counts recorded for every run.

## Assumptions & open decisions
- ASSUMPTION: 5-working-day clearance window.
- D04 (partial barter test scenarios depend on this): PROVISIONAL (D04 default, unapproved).
