# PS-132-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-06.R01 | Each execution step is recorded before and after the side effect; restart resumes at the first unrecorded step. | MVP |
| PS-132-06.R02 | Steps with external effects (session revocation, peer pause) are idempotent by target and action ID. | MVP |
| PS-132-06.R03 | If a dependency is unavailable, the step returns `RESPONSE.DEPENDENCY_UNAVAILABLE` (503, retryable) and the action stays `executing`. | MVP |
| PS-132-06.R04 | Rollback is attempted only for `reversible` actions; irreversible actions require a new action. | MVP |
| PS-132-06.R05 | Partial completion is reported with `affected_count` and the list of unfinished targets. | MVP |

## Data / schema
Step log entries: `action_id`, `step_index`, `started_at`, `finished_at`, `outcome`.

## Commands / queries / events
`response.execute` runs under a single lock per action.

## States & transitions
Failure after partial effect: `failed`, not `rolled_back`, until a human approves rollback.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| RESPONSE.DEPENDENCY_UNAVAILABLE | unavailable (503) | true | err.response.dependency_unavailable |

## Authorization
N/A beyond [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Containment cannot be initiated offline; offline clients see status only.
- Concurrent actions on the same target are serialized; the later one is queued and rechecked.
- Clock skew affects only the 5-minute expiry; server time is authoritative.

## Privacy, retention, abuse
Step logs contain IDs and outcomes only.

## Observability & budgets
Metric `response_steps_failed_total{step_type}`; alert on any failed platform-wide step.

## Tests
- TEST-PS-132-06-01: chaos, executor killed between side effect and record; no double revocation.
- TEST-PS-132-06-02: integration, dependency outage yields retryable error and later success.
- TEST-PS-132-06-03: rollback of reversible flag change restores prior value.

## Acceptance criteria
1. No double side effect in 1,000 injected crashes.
2. Partial completion reported with exact unfinished targets.

## Assumptions & open decisions
- ASSUMPTION: step log retained with incident.
- D08 (offline status reads): PROVISIONAL (D08 default, unapproved).
