# PS-140-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision` (`null` on create). | MVP |
| PS-140-04.R02 | Each command is versioned `v1`; a breaking change requires a new command name. | MVP |
| PS-140-04.R03 | Event `event_type` matches CTR-EVT-001 R10 (`<aggregate_type>.<past-tense-verb>`). | MVP |
| PS-140-04.R04 | Queries are paginated (max 100 items per page) and never return fixture bodies. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| RegisterOfflineScenario | `(scenario: offline_scenario)` | `scenario_key` | `offline_scenario.registered` | OFFTEST.SCENARIO_DUPLICATE, OFFTEST.FIXTURE_NOT_SYNTHETIC, SYS.FORBIDDEN |
| ActivateScenario | `(scenario_key, expected_revision)` | `scenario_key` + revision | `offline_scenario.activated` | OFFTEST.BUDGET_UNDEFINED, SYS.CONFLICT, OFFTEST.INVALID_TRANSITION |
| RecordOfflineRun | `(run: offline_run)` | `build_ref` + `scenario_key` + `attempt` | `offline_run.completed` | OFFTEST.BUILD_REF_INVALID, OFFTEST.ATTEMPT_OUT_OF_ORDER, SYS.FORBIDDEN |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| ListOfflineScenarios | `status?`, `cursor`, `limit` ≤ 100 | scenario summaries | SYS.REQUEST_MALFORMED |
| GetOfflineRunResult | `run_id` | run record without raw logs | SYS.NOT_FOUND |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| offline_scenario.registered | offline_scenario | PUBLIC | scenario_key, version, revision |
| offline_scenario.activated | offline_scenario | PUBLIC | scenario_key, version |
| offline_run.completed | offline_run | PUBLIC | run_id, scenario_key, outcome, duration_ms |

Envelope fields follow CTR-EVT-001 exactly. `actor_ref` is a `sys_` or `acc_` ID. Subscribers receive events in `(aggregate_id, revision)` order.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-140-04-01 (contract): commands without idempotency_key are rejected; duplicate keys return the original record.
- TEST-PS-140-04-02 (contract): offline_run.completed validates against the CTR-EVT-001 envelope schema.

## Acceptance criteria
1. TEST-PS-140-04-01, TEST-PS-140-04-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no subscriber outside F17.S03.M02 gates is defined; revisit at contract review.
- No Dxx decision directly governs this file; D01 applies only if run results are federated: PROVISIONAL (D01 default, unapproved).
