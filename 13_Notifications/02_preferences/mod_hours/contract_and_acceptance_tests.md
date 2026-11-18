# PS-105-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-09.R01 | Contract tests cover every HOURS.* code and every event in PS-105-04. | MVP |
| PS-105-09.R02 | Settings UI passes keyboard-only and screen-reader checks; each window row has a labeled day, start and end control. | MVP |
| PS-105-09.R03 | Time-zone picker has a text-search alternative; no color-only status. | MVP |
| PS-105-09.R04 | Tests run with pinned tzdata and fixed clock. | MVP |

## Data / schema
Fixtures: accounts in Europe/Berlin, America/New_York, Australia/Sydney, Pacific/Chatham (+12:45 edge), and a non-DST zone.

## Commands / queries / events
Replay each command with valid, invalid, duplicate and stale-revision inputs.

## States & transitions
All rows of workflow_state_machine covered.

## Validation & errors
One failing fixture per validation rule in PS-105-02.

## Authorization
Cross-account and sys-only fixtures (PS-105-05).

## Failure, idempotency, concurrency, offline
Fault-injection fixtures from PS-105-06.

## Privacy, retention, abuse
Log and event scans for window values (PS-105-07).

## Observability & budgets
Suite runtime ≤ 5 min for contract layer.

## Tests
- TEST-PS-105-09-01 (contract): all HOURS codes match CTR-ERR-001.
- TEST-PS-105-09-02 (e2e): create three windows, verify push deferral in fixed clock.
- TEST-PS-105-09-03 (a11y): settings keyboard path and labels.
- TEST-PS-105-09-04 (offline): edit while offline, reconnect, conflict view.

## Acceptance criteria
1. Contract suite green on CI.
2. DST fixtures pass for all five zones.
3. Accessibility checklist submitted to Accessibility Lead (future gate).

## Assumptions & open decisions
- ASSUMPTION: fixture zone list.
- No Dxx blocks test scope.
