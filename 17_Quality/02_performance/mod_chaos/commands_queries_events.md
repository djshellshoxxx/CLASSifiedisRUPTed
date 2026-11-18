# PS-138-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-04.R01 | `chaos.start`, `chaos.abort` and `chaos.revert` are idempotent by (`experiment_id`, command). | MVP |
| PS-138-04.R02 | `chaos.abort` is accepted by any authorized operator at any time while `running`. | MVP |
| PS-138-04.R03 | Status query p95 ≤ 200 ms (ASSUMPTION). | MVP |
| PS-138-04.R04 | Events carry `max_data_class` PUBLIC. | MVP |

## Data / schema
Command bodies reference [domain_schema.md](domain_schema.md).

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| chaos.propose | command | FAULT_TYPE_INVALID, PRODUCTION_TARGET_FORBIDDEN, DURATION_EXCEEDED, ABORT_CONDITION_MISSING |
| chaos.approve | command | TRANSITION_INVALID, CAP.SELF_APPROVAL_FORBIDDEN |
| chaos.start | command | CONCURRENCY_LIMIT, TRANSITION_INVALID |
| chaos.abort | command | TRANSITION_INVALID |
| chaos.get / chaos.list_running | query | SYS.NOT_FOUND |
| chaos_experiment.proposed / approved / started / aborted / completed / revert_failed | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Abort is never blocked by a concurrency limit.

## Privacy, retention, abuse
Events carry IDs and verdicts only.

## Observability & budgets
Command latency and error counters.

## Tests
- TEST-PS-138-04-01: contract, event schemas.
- TEST-PS-138-04-02: integration, abort during running fault reverts.

## Acceptance criteria
1. Abort succeeds in 100% of drills regardless of concurrency count.
2. Duplicate start returns existing run.

## Assumptions & open decisions
- ASSUMPTION: abort is always authorized to the experiment operator.
- D01 (federation relay faults): PROVISIONAL (D01 default, unapproved).
