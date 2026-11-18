# PS-107-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-09.R01 | Contract tests cover every OPT.* code and event in PS-107-04. | MVP |
| PS-107-09.R02 | Matrix UI uses native checkboxes with programmatic labels naming channel and category; disabled cells explain why. | MVP |
| PS-107-09.R03 | Consent wording for each enable is tested for presence and plain language by Accessibility and UX review (future gate). | MVP |
| PS-107-09.R04 | Email unsubscribe pages pass WCAG 2.2 AA checks in three locales. | MVP |

## Data / schema
Fixtures: accounts with default matrix, fully opted-in, withdrawn-all; expired and reused tokens.

## Commands / queries / events
Replay with stale revisions and duplicate unsubscribes.

## States & transitions
All rows of workflow_state_machine.

## Validation & errors
One failing fixture per PS-107-02 rule.

## Authorization
Token scope and operator denial fixtures (PS-107-05).

## Failure, idempotency, concurrency, offline
Fault injection from PS-107-06.

## Privacy, retention, abuse
Response-equality test for unsubscribe (PS-107-07).

## Observability & budgets
Contract suite ≤ 5 min.

## Tests
- TEST-PS-107-09-01 (contract): all OPT codes match CTR-ERR-001.
- TEST-PS-107-09-02 (e2e): enable email, confirm by POST, receive, unsubscribe via link.
- TEST-PS-107-09-03 (a11y): matrix keyboard and screen reader path.
- TEST-PS-107-09-04 (offline): withdraw offline, reconnect, single event.

## Acceptance criteria
1. Contract suite green.
2. e2e path passes.
3. Accessibility checks pass for matrix and unsubscribe pages.

## Assumptions & open decisions
- ASSUMPTION: three locales for unsubscribe pages (en, de and one more; from mod_languages).
- No Dxx blocks test scope.
