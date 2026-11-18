# PS-131-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-09.R01 | Contract tests validate every event schema and every `INCIDENT.*` code. | MVP |
| PS-131-09.R02 | Tabletop drill scenario per category in PS-131-01 is runnable in staging. | MVP |
| PS-131-09.R03 | Property test: random transition sequences never reach `closed` without a review record. | MVP |
| PS-131-09.R04 | Hash-chain tamper test detects any single-entry edit. | MVP |

## Data / schema
Synthetic incidents only; no production data.

## Commands / queries / events
Covers [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Covers [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Covers [validation_rules.md](validation_rules.md).

## Authorization
Covers PS-131-05 decision table.

## Failure, idempotency, concurrency, offline
Covers PS-131-06 scenarios.

## Privacy, retention, abuse
Test data contains no real coordinates or identifiers.

## Observability & budgets
Drill runtime ≤ 30 min (ASSUMPTION).

## Tests
- TEST-PS-131-09-01: contract, event and code registry.
- TEST-PS-131-09-02: e2e, tabletop SEV2 scenario from declare to close.
- TEST-PS-131-09-03: property, closure invariant.

## Acceptance criteria
1. Drill completes with all events in expected order.
2. Property suite runs ≥ 10,000 cases without violation.

## Assumptions & open decisions
- ASSUMPTION: drill cadence quarterly.
- D07 default governs fixture retention: PROVISIONAL (D07 default, unapproved).
