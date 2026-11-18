# PS-142-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-FED-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-09.R01 | Every row of a published matrix has a result for each release candidate or a justified `not_run`. | MVP |
| PS-142-09.R02 | Schema-reader tests cover the previous minor and one previous major version (CTR-SCH-001). | MVP |
| PS-142-09.R03 | Peer-protocol rows match CTR-FED-001 version registry. | MVP |

## Tests
- TEST-PS-142-09-01 (contract): old-reader fixture reads new-minor records with unknown fields preserved.
- TEST-PS-142-09-02 (contract): record written by previous major version rejected with a typed error, not silently dropped.
- TEST-PS-142-09-03 (lint): COMPAT codes pass CTR-ERR-001 registry lint.
- TEST-PS-142-09-04 (integration): stale result does not satisfy a supported row in gates.
- TEST-PS-142-09-05 (a11y): screen-reader row in matrix has a valid assistive-tech test result.

## Acceptance criteria
1. All TEST-PS-142-09-01 to -05 pass.
2. MVP matrix has no `supported` row without a fresh result.

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

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Assumptions & open decisions
- ASSUMPTION: lab device pool exists for the MVP matrix.
- D01 (peer protocol): PROVISIONAL (D01 default, unapproved).
