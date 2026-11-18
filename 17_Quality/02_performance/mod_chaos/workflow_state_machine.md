# PS-138-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-03.R01 | Only transitions in the table are permitted. | MVP |
| PS-138-03.R02 | An abort condition breach stops fault injection within 10 s (ASSUMPTION) and sets `aborted`. | MVP |
| PS-138-03.R03 | Fault injection is always reverted at experiment end, including after abort or crash. | MVP |
| PS-138-03.R04 | `held` and `violated` are terminal; a re-run creates a new experiment. | MVP |

## Data / schema
`verdict` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events `chaos_experiment.<past-tense>`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | propose | validated | proposed | emit `chaos_experiment.proposed` |
| proposed | approve | second approver (not proposer) | approved | emit `chaos_experiment.approved` |
| approved | start | concurrency limit not exceeded; steady state confirmed | running | inject fault; emit `chaos_experiment.started` |
| running | duration elapsed | none | reverting | revert fault |
| running | abort condition | threshold breached | aborted | revert fault; emit `chaos_experiment.aborted` |
| reverting | reverted | fault removed and steady state restored | held or violated | record verdict; emit `chaos_experiment.completed` |
| reverting | revert failed | any | violated | page operator; emit `chaos_experiment.revert_failed` |

## Validation & errors
`CHAOS.TRANSITION_INVALID` (conflict, 409) for other pairs.

## Authorization
Start requires operator with `execute` scope on the staging component.

## Failure, idempotency, concurrency, offline
Revert is idempotent. A watchdog reverts any fault still active after `max_duration_s` plus 60 s.

## Privacy, retention, abuse
Transitions carry no personal data.

## Observability & budgets
Metric `chaos_revert_seconds` (p95 ≤ 30 s, ASSUMPTION).

## Tests
- TEST-PS-138-03-01: unit, transition table.
- TEST-PS-138-03-02: chaos-of-chaos, kill runner mid-fault; watchdog reverts within limit.

## Acceptance criteria
1. No fault remains active after watchdog window in 100 injected crashes.
2. Abort within 10 s in 100% of threshold drills.

## Assumptions & open decisions
- ASSUMPTION: 10 s abort and 60 s watchdog grace.
- D04 (partial barter during faults): PROVISIONAL (D04 default, unapproved).
