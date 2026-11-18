# PS-106-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-09.R01 | Contract tests cover every INPREF.* code and every event in PS-106-04. | MVP |
| PS-106-09.R02 | Inbox list is a labeled list with unread state conveyed as text, not color only (WCAG 1.4.1). | MVP |
| PS-106-09.R03 | Preference toggles are native checkboxes with visible labels; `security` toggle is disabled with explanation text. | MVP |
| PS-106-09.R04 | Projection tests use replayed event fixtures. | MVP |

## Data / schema
Fixtures: accounts with 0, 50, 1000 and 1001 items; each category combination; each retention value.

## Commands / queries / events
Replay with duplicate and out-of-order (by revision) events.

## States & transitions
All rows of workflow_state_machine covered.

## Validation & errors
One failing fixture per rule in PS-106-02.

## Authorization
Negative fixtures from PS-106-05.

## Failure, idempotency, concurrency, offline
Chaos fixtures from PS-106-06.

## Privacy, retention, abuse
Log and event scans (PS-106-07).

## Observability & budgets
Contract suite ≤ 5 min.

## Tests
- TEST-PS-106-09-01 (contract): all INPREF codes match CTR-ERR-001.
- TEST-PS-106-09-02 (e2e): receive item, mark read, count decreases.
- TEST-PS-106-09-03 (a11y): screen reader announces unread state and disabled security toggle explanation.
- TEST-PS-106-09-04 (offline): mark-read offline, reconnect, one event.

## Acceptance criteria
1. Contract suite green.
2. Accessibility checks pass for list and toggles.
3. Accessibility Lead sign-off pending (future gate).

## Assumptions & open decisions
- ASSUMPTION: fixture counts above.
- No Dxx blocks test scope.
