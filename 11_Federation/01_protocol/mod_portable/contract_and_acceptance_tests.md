# PS-083-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Tests section), CTR-SCH-001 (R09), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-09.R01 | Golden fixtures for `bundle.*` schema versions. | MVP |
| PS-083-09.R02 | Contract tests against CTR-FED-001 verification order, steps 1–14. | MVP |
| PS-083-09.R03 | Two-node acceptance test: export on node A, import on node B, both trusted. | MVP |

## Data / schema
Fixtures: two synthetic nodes, keys with `valid_from`, one revoked key, one expired bundle.

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
Synthetic data only.

## Observability & budgets
Suite ≤ 10 min (ASSUMPTION).

## Tests
- TEST-PS-083-09-01 (contract): verification order step failures map to FED codes.
- TEST-PS-083-09-02 (acceptance): two-node export and import.
- TEST-PS-083-09-03 (property): any reordering of events in a bundle yields same accepted set.

## Acceptance criteria
1. Fixtures present for supported versions.
2. Two-node test passes.
3. Requirement-to-test map complete.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
