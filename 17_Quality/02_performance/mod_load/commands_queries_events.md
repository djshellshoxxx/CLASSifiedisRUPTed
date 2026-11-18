# PS-139-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-04.R01 | `load.define_workload` and `load.define_profile` are idempotent by content digest. | MVP |
| PS-139-04.R02 | `load.run` is idempotent by (`profile_id`, `workload_id`, `build_sha`, `attempt`). | MVP |
| PS-139-04.R03 | `load.get_result` p95 ≤ 200 ms (ASSUMPTION). | MVP |
| PS-139-04.R04 | Events carry `max_data_class` PUBLIC. | MVP |

## Data / schema
Command bodies reference [domain_schema.md](domain_schema.md).

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| load.define_workload | command | WEIGHTS_INVALID, OPERATION_UNKNOWN |
| load.define_profile | command | RATE_ABOVE_CEILING, POPULATION_TOO_LARGE |
| load.run | command | PRODUCTION_TARGET_FORBIDDEN, RATE_ABOVE_CEILING, SYS.UNAVAILABLE |
| load.abort | command | TRANSITION_INVALID |
| load.get_result / load.list_runs | query | SYS.NOT_FOUND |
| load_run.queued / started / steady / ramping_down / completed / aborted / failed | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Abort is never blocked by queue position.

## Privacy, retention, abuse
Events carry IDs only.

## Observability & budgets
Latency and error counters.

## Tests
- TEST-PS-139-04-01: contract, event schemas.
- TEST-PS-139-04-02: integration, duplicate `load.run` returns the existing run.

## Acceptance criteria
1. Duplicate runs never double the generated traffic.
2. Abort honoured in every state except terminal.

## Assumptions & open decisions
- ASSUMPTION: abort is available to QA Lead and the run owner.
- D01 (relay batch load): PROVISIONAL (D01 default, unapproved).
