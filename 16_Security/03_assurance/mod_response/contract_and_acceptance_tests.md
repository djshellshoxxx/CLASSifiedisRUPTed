# PS-132-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-09.R01 | Contract tests for every `RESPONSE.*` code and every `response.*` event. | MVP |
| PS-132-09.R02 | Each action type has a staging rehearsal with rollback where `reversible` is true. | MVP |
| PS-132-09.R03 | Property: no sequence of commands reaches `executed` without required approvals. | MVP |
| PS-132-09.R04 | Crash-injection test at every step boundary. | MVP |

## Data / schema
Synthetic targets only.

## Commands / queries / events
Covers [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Covers [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Covers [validation_rules.md](validation_rules.md).

## Authorization
Covers PS-132-05 table.

## Failure, idempotency, concurrency, offline
Covers PS-132-06 scenarios.

## Privacy, retention, abuse
Synthetic IDs only.

## Observability & budgets
Suite runtime ≤ 20 min (ASSUMPTION).

## Tests
- TEST-PS-132-09-01: contract, codes and events.
- TEST-PS-132-09-02: e2e, quarantine rehearsal in staging.
- TEST-PS-132-09-03: property, approval invariant.
- TEST-PS-132-09-04: chaos, crash at each step.

## Acceptance criteria
1. Every action type rehearsed once per release.
2. Property suite passes ≥ 10,000 cases.

## Assumptions & open decisions
- ASSUMPTION: rehearsal cadence per release.
- D01 default governs quarantine fixtures: PROVISIONAL (D01 default, unapproved).
