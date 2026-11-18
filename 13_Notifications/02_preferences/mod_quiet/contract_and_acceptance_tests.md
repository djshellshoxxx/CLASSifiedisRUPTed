# PS-108-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-09.R01 | Contract tests cover every QUIET.* code and event in PS-108-04. | MVP |
| PS-108-09.R02 | Pause control is a button group with preset labels and a live region that announces the end time in text. | MVP |
| PS-108-09.R03 | Countdown is not the only information: end time in absolute text is also shown. | MVP |
| PS-108-09.R04 | Tests run with a fixed clock and DST fixtures from mod_hours. | MVP |

## Data / schema
Fixtures: accounts with each preset, in two zones, with and without valid zone.

## Commands / queries / events
Replay with duplicates and stale revisions.

## States & transitions
All rows of workflow_state_machine.

## Validation & errors
One failing fixture per PS-108-02 rule.

## Authorization
Sender and operator fixtures (PS-108-05).

## Failure, idempotency, concurrency, offline
Fault injection from PS-108-06.

## Privacy, retention, abuse
Leakage tests (PS-108-07).

## Observability & budgets
Suite runtime ≤ 5 min.

## Tests
- TEST-PS-108-09-01 (contract): all QUIET codes match CTR-ERR-001.
- TEST-PS-108-09-02 (e2e): start 1 h pause, send deadline, see held push, end pause, see release.
- TEST-PS-108-09-03 (a11y): button group and live region checked.
- TEST-PS-108-09-04 (offline): start offline, reconnect, one period.

## Acceptance criteria
1. Contract suite green.
2. e2e passes.
3. Accessibility checks pass.

## Assumptions & open decisions
- ASSUMPTION: fixture zones from mod_hours.
- No Dxx blocks test scope.
