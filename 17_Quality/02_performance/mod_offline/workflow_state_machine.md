# PS-140-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (state changes emit events), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-03.R01 | Scenario states are exactly `draft`, `active`, `retired`. Run states are exactly `queued`, `running`, `completed`, `aborted_infra`. | MVP |
| PS-140-03.R02 | Only `active` scenarios can be started. A run binds to one `scenario_version` at start and keeps it. | MVP |
| PS-140-03.R03 | Every other from/event pair returns `OFFTEST.INVALID_TRANSITION` with no state change. | MVP |
| PS-140-03.R04 | A run reaches a terminal state within 30 minutes of `running` (ASSUMPTION) or ends as `aborted_infra`. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | RegisterOfflineScenario | `scenario_key` unique; fixture synthetic | draft | emit `offline_scenario.registered` |
| draft | ActivateScenario | `budget_ref` resolves; second maintainer approval | active | emit `offline_scenario.activated` |
| active | UpdateScenario | new `version`; `expected_revision` matches | active | prior version retained, read-only |
| active | RetireScenario | no run in `running` | retired | runs stay readable |
| draft | RetireScenario | none | retired | none |
| queued | StartRun | runner `sys_` bound; scenario active | running | start timer (30 min) |
| running | CompleteRun | all assertions evaluated | completed | emit `offline_run.completed`, `outcome` = pass or fail |
| running | TimeoutRun | timer expired | aborted_infra | emit `offline_run.completed`, outcome `aborted_infra` |
| running | AbortRun | runner infra error | aborted_infra | same as timeout |

## Validation & errors
Invalid pairs return `OFFTEST.INVALID_TRANSITION` (category `unprocessable_state`, 422, not retryable). Terminal run states are immutable; a new attempt creates a new run.

## Failure, idempotency, concurrency, offline
- Two activations race: the second receives `SYS.CONFLICT` through `expected_revision`.
- Runner crash while `running`: the timer moves the run to `aborted_infra`; no partial assertion set is published.
- Runner outbox replays `CompleteRun`: duplicate keys are no-ops (see [failure_recovery](failure_recovery_idempotency.md)).

## Assumptions & open decisions
- ASSUMPTION: 30-minute run timeout is the default; confirm with CI owner.
- D08 (offline writes) is out of scope for state transitions here; the offline queue states belong to F15.S01.M01: PROVISIONAL (D08 default, unapproved).
