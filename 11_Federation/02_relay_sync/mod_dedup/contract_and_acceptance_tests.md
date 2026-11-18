# PS-087-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Tests section), CTR-SCH-001 (R09), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-09.R01 | Golden fixtures for `dedup.*` schemas. | MVP |
| PS-087-09.R02 | Contract tests for duplicate and equivocation outcomes per CTR-FED-001 R05, R06. | MVP |
| PS-087-09.R03 | Replay test: a relay re-sends a full batch; no event reprocessed. | MVP |

## Data / schema
Fixtures: duplicate batch, equivocating pair, old revision.

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
Suite ≤ 5 min (ASSUMPTION).

## Tests
- TEST-PS-087-09-01 (contract): duplicate and equivocation outcomes.
- TEST-PS-087-09-02 (replay): full re-send processes zero events twice.
- TEST-PS-087-09-03 (property): dedupe result independent of arrival order.

## Acceptance criteria
1. Fixtures present.
2. Replay test passes.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
