# PS-138-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-09.R01 | Experiment set CHX-01 to CHX-06 covers: relay outage, DB failover, duplicate delivery, key service unavailable, scheduler crash, clock skew. | MVP |
| PS-138-09.R02 | CHX-04 (key service unavailable) verifies `SIG.KEY_UNAVAILABLE` with no unsigned event (PS-130-06.R01). | MVP |
| PS-138-09.R03 | CHX-05 (scheduler crash) verifies exactly one activation of a scheduled policy (PS-129-06.R02). | MVP |
| PS-138-09.R04 | CHX-03 (duplicate delivery) verifies exactly-once application under CTR-EVT-001 R03. | MVP |
| PS-138-09.R05 | Each experiment has a recorded hypothesis and verdict. | MVP |

## Data / schema
Experiment definitions in repository.

## Commands / queries / events
Covered by [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Covered by [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Covered by [validation_rules.md](validation_rules.md).

## Authorization
Covered by [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Covered by [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Covered by [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Covered by [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-138-09-01: CHX-01 relay outage, queued events deliver after recovery.
- TEST-PS-138-09-02: CHX-02 DB failover, no lost acknowledged write.
- TEST-PS-138-09-03: CHX-03 duplicate delivery, exactly-once effect.
- TEST-PS-138-09-04: CHX-04 key service unavailable, no unsigned event.
- TEST-PS-138-09-05: CHX-05 scheduler crash, single activation.
- TEST-PS-138-09-06: CHX-06 clock skew ±5 min, CTR-EVT-001 timestamp bounds hold.

## Acceptance criteria
1. All six experiments hold their hypotheses on the release candidate.
2. Each experiment links to one or more PS-IDs.

## Assumptions & open decisions
- ASSUMPTION: experiment set CHX-01 to CHX-06 is the MVP set.
- D01 and D08 defaults govern CHX-01 and CHX-03: PROVISIONAL (default, unapproved).
