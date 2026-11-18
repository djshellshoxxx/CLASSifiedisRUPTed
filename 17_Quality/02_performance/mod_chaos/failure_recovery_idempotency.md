# PS-138-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-06.R01 | Watchdog reverts any fault still active at `max_duration_s` + 60 s, independent of the runner. | MVP |
| PS-138-06.R02 | Revert is idempotent and records the observed state before and after. | MVP |
| PS-138-06.R03 | If revert fails, the experiment goes to `violated` and an operator page is raised within 60 s. | MVP |
| PS-138-06.R04 | Steady-state checks run before start; no start while steady state is not met. | MVP |
| PS-138-06.R05 | Experiment on a component already faulted by another experiment is refused. | MVP |

## Data / schema
Watchdog state: `experiment_id`, `deadline_at`, `fault_handle`.

## Commands / queries / events
Watchdog is a `sys_` job independent of the runner process.

## States & transitions
Revert failure → `violated` (see PS-138-03).

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| CHAOS.STEADY_STATE_NOT_MET | precondition_failed (412) | true | err.chaos.steady_state_not_met |
| CHAOS.TARGET_BUSY | conflict (409) | true | err.chaos.target_busy |

## Authorization
N/A beyond [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Clock drift between watchdog and runner: watchdog uses its own monotonic clock.
- Staging network partition during an experiment: abort path uses a second channel (ASSUMPTION).

## Privacy, retention, abuse
Recovery logs contain IDs and metric names.

## Observability & budgets
Metric `chaos_watchdog_reverts_total`; alert on any watchdog revert (indicates runner failure).

## Tests
- TEST-PS-138-06-01: chaos-of-chaos, runner killed; watchdog reverts within window.
- TEST-PS-138-06-02: revert failure produces `violated` and page.
- TEST-PS-138-06-03: second experiment on busy target refused.

## Acceptance criteria
1. Watchdog reverts in 100% of runner-kill drills.
2. No double-fault on a target in fixtures.

## Assumptions & open decisions
- ASSUMPTION: second abort channel exists.
- D08 (offline clients under fault): PROVISIONAL (D08 default, unapproved).
