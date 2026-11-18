# PS-134-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-03.R01 | Each run is in exactly one state: queued, running, passed, failed, errored, skipped | MVP |
| PS-134-03.R02 | `errored` (infrastructure: browser crash, runner lost, environment unavailable) is distinct from `failed` (assertion) | MVP |
| PS-134-03.R03 | Only `errored` runs may be re-run automatically, max 1 re-run per scenario per commit | MVP |
| PS-134-03.R04 | Quarantined scenarios produce `skipped` runs with reason; they never produce `passed` | MVP |

## Data / schema
Uses `E2ERun.result` and `E2EScenario.status`. Transition record: `{run_id, from, to, at, reason_code}`.

## Commands / queries / events
Transitions driven by RunScenario, RecordResult, QuarantineScenario (PS-134-04).

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| queued | start | environment ready | running | start trace |
| running | all assertions pass | none | passed | RunCompleted |
| running | assertion fails | none | failed | RunCompleted with first_failed_step |
| running | browser crash or runner lost | none | errored | RunCompleted; re-run allowed once |
| errored | re-run | count < 1 for commit | queued | new attempt |
| queued | scenario quarantined | approval per mod_unit flow | skipped | ScenarioQuarantined |
| running | timeout (max_duration_s) | none | errored | reason TIMEOUT |

## Validation & errors
`E2E.ILLEGAL_TRANSITION` (non-retryable).

## Authorization
Quarantine approval requires a role other than requester (mod_unit rule).

## Failure, idempotency, concurrency, offline
Transitions are idempotent per (run_id, to). Concurrent RecordResult calls: first write wins; second returns the stored result.

## Privacy, retention, abuse
Transition log keeps IDs and codes only.

## Observability & budgets
Gauge of runs per state; alert when errored share > 10% for a day (ASSUMPTION).

## Tests
- TEST-PS-134-03-01 (unit): every table row.
- TEST-PS-134-03-02 (integration): killed browser yields errored, not failed; one automatic re-run.
- TEST-PS-134-03-03 (unit): quarantined scenario never yields passed.

## Acceptance criteria
1. Errored and failed are separately counted in dashboards.
2. Re-run limit enforced at 1 per commit.
3. Quarantined scenarios cannot record passed (test with forced pass attempt).

## Assumptions & open decisions
- ASSUMPTION: 120 s scenario timeout is enforced by the runner, not by the step.
- D08 PROVISIONAL (D08 default, unapproved): offline scenarios hold their queue state until a fixture relay acknowledgment, not until a UI success message.
