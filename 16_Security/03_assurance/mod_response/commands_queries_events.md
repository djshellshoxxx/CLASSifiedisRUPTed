# PS-132-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-04.R01 | Every command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-132-04.R02 | `response.execute` is idempotent on (`action_id`, step_index). | MVP |
| PS-132-04.R03 | Command p95 ≤ 500 ms, excluding the execution steps themselves (ASSUMPTION). | MVP |
| PS-132-04.R04 | Events carry `max_data_class` ≤ PRIVATE_PERSONAL. | MVP |

## Data / schema
Command bodies mirror [domain_schema.md](domain_schema.md).

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| response.propose | command | ACTION_TYPE_INVALID, ROLLBACK_PLAN_INVALID, TARGET_MISMATCH, INCIDENT_REQUIRED |
| response.approve | command | TWO_APPROVERS_REQUIRED, SELF_APPROVAL_FORBIDDEN, TRANSITION_INVALID |
| response.execute | command (sys) | TRANSITION_INVALID, SYS.UNAVAILABLE |
| response.rollback | command | TRANSITION_INVALID |
| response.get / response.list_by_incident | query | SYS.NOT_FOUND |
| response.proposed, approved, executing, executed, failed, expired, rolled_back | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md) and CTR-ERR-001.

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Clients cannot execute containment offline. Duplicate execute returns the stored step result.

## Privacy, retention, abuse
Events carry IDs only.

## Observability & budgets
Latency histogram and error counter by code.

## Tests
- TEST-PS-132-04-01: contract, event schemas.
- TEST-PS-132-04-02: integration, duplicate execute produces one step effect.

## Acceptance criteria
1. Every command has a contract test.
2. Duplicate execute produces zero additional side effects.

## Assumptions & open decisions
- ASSUMPTION: events carry IDs only.
- D01 (federated quarantine notice): PROVISIONAL (D01 default, unapproved).
