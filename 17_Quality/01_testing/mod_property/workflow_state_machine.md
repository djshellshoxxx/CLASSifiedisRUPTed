# PS-136-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-03.R01 | A property run is `queued`, `running`, `pass`, `fail` or `error`. | MVP |
| PS-136-03.R02 | `error` means harness failure (generator crash, timeout); it is distinct from `fail` (invariant violated). | MVP |
| PS-136-03.R03 | On `fail`, shrinking runs until a minimal counterexample or 10,000 shrink steps (ASSUMPTION). | MVP |
| PS-136-03.R04 | `pass`, `fail`, `error` are terminal for a run. | MVP |

## Data / schema
`outcome` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events `property_run.<past-tense>`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | schedule | property registered | queued | emit `property_run.queued` |
| queued | start | seed recorded | running | emit `property_run.started` |
| running | cases complete | no violation | pass | emit `property_run.passed` |
| running | violation | shrink finished | fail | persist counterexample; emit `property_run.failed` |
| running | harness error | any | error | emit `property_run.errored` |

## Validation & errors
Invalid transition is a harness bug and fails the pipeline.

## Authorization
Only CI and QA Lead may schedule nightly runs.

## Failure, idempotency, concurrency, offline
Harness crash preserves seed; re-run resumes from the same seed.

## Privacy, retention, abuse
No personal data.

## Observability & budgets
Metric `property_run_duration_seconds{property}`.

## Tests
- TEST-PS-136-03-01: unit, transition table.
- TEST-PS-136-03-02: harness, deliberately wrong invariant yields `fail` with minimal counterexample.

## Acceptance criteria
1. Every `fail` has a persisted counterexample.
2. `error` never reported as `pass`.

## Assumptions & open decisions
- ASSUMPTION: shrink step cap 10,000.
- D02 default: PROVISIONAL (D02 default, unapproved).
