# PS-088-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Tests section), CTR-SCH-001 (R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-09.R01 | Golden fixtures for batch and result schemas. | MVP |
| PS-088-09.R02 | Contract tests for every FED.* code emitted by delivery. | MVP |
| PS-088-09.R03 | Two-node acceptance test with simulated partition and resend. | MVP |

## Data / schema
Fixtures: two nodes, a partition, a revoked peer, a deferred-key event.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
[failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Synthetic data.

## Observability & budgets
Suite ≤ 10 min (ASSUMPTION).

## Tests
- TEST-PS-088-09-01 (contract): codes and retryable flags match registry.
- TEST-PS-088-09-02 (acceptance): partition then recover, all events delivered once.
- TEST-PS-088-09-03 (property): any batch split yields same accepted set.

## Acceptance criteria
1. Fixtures present.
2. Partition test passes.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
