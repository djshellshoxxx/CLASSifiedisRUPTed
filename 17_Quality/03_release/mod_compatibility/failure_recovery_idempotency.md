# PS-142-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-06.R01 | Result uploads retry at most 3 times, backoff 15 s, 60 s, 300 s (ASSUMPTION). | MVP |
| PS-142-06.R02 | A duplicate `RecordCompatResult` with the same key returns the original record. | MVP |
| PS-142-06.R03 | A result older than its matrix's `published_at` cannot upgrade a row's status. | MVP |

## Failure, idempotency, concurrency, offline
- **Lab device unavailable:** the cell is recorded `not_run`; it blocks a `supported` claim until a result exists.
- **Matrix supersession during a run:** the run's result is recorded against the matrix version it started with; no silent rebinding.
- **Partial matrix publish:** publish is atomic per matrix version; a failed publish leaves the prior version `published`.
- **Concurrent publishers:** `expected_revision` decides; loser gets `SYS.CONFLICT`.

## Tests
- TEST-PS-142-06-01 (unit): duplicate result key returns original.
- TEST-PS-142-06-02 (integration): publish fails mid-write; prior version stays published.
- TEST-PS-142-06-03 (negative): result for an old commit cannot satisfy a gate row.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Acceptance criteria
1. the tests above pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: retry values are defaults.
- D07 (retention) default applies to result records: PROVISIONAL (D07 default, unapproved).
