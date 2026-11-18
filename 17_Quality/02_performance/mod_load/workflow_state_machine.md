# PS-139-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-03.R01 | A load run is `queued`, `ramping`, `steady`, `ramping_down`, `completed`, `aborted` or `failed`. | MVP |
| PS-139-03.R02 | `aborted` occurs when an abort condition holds for 60 s (ASSUMPTION). | MVP |
| PS-139-03.R03 | `completed` requires a result summary with all required percentiles. | MVP |
| PS-139-03.R04 | Terminal states are `completed`, `aborted` and `failed`. | MVP |

## Data / schema
`result` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events `load_run.<past-tense>`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | queue | profile and workload valid | queued | emit `load_run.queued` |
| queued | start | environment at baseline | ramping | emit `load_run.started` |
| ramping | target reached | rate achieved | steady | emit `load_run.steady` |
| steady | profile end | duration elapsed | ramping_down | emit `load_run.ramping_down` |
| ramping_down | done | summary computed | completed | emit `load_run.completed` |
| any active | abort condition | threshold breached 60 s | aborted | stop generators; emit `load_run.aborted` |
| any active | harness error | any | failed | stop generators; emit `load_run.failed` |

## Validation & errors
`LOAD.TRANSITION_INVALID` (conflict, 409) for other pairs.

## Authorization
Start requires QA Lead or CI `sys_` with staging scope.

## Failure, idempotency, concurrency, offline
Generators stop on abort within 10 s. Partial results are stored with `failed`.

## Privacy, retention, abuse
No personal data in run states.

## Observability & budgets
Metric `load_run_state_seconds{state}`.

## Tests
- TEST-PS-139-03-01: unit, transition table.
- TEST-PS-139-03-02: integration, injected error threshold triggers abort after 60 s.

## Acceptance criteria
1. No run remains `steady` past profile duration.
2. Abort stops generators within 10 s in fixtures.

## Assumptions & open decisions
- ASSUMPTION: 60 s abort hold.
- D08 (offline reconnect storms): PROVISIONAL (D08 default, unapproved).
