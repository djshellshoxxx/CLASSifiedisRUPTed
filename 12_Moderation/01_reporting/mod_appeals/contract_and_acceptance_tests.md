# PS-092-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-09.R01 | Every row in the PS-092-03 transition table has a passing test; every non-table pair expects `APPEALS.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-092-09.R02 | Contract tests validate all commands, events and errors against CTR-SCH-001 and CTR-ERR-001 in CI. | MVP |
| PS-092-09.R03 | Cross-module test: a reversed appeal changes `mod_enforcement` state exactly once (contract with `mod_enforcement`). | MVP |

## Data / schema
Fixtures: one enforcement action per type; one spam verdict; one report closure; reviewer, reporter and appellant test accounts with pseudonyms (no real data).

## Commands / queries / events
Test IDs `TEST-PS-092-09-nn`.

## States & transitions
All eight states and eleven transitions exercised; `implemented` path tested with enforcement stub and real service.

## Validation & errors
Negative corpus covers every code in PS-092-02.

## Authorization
Table-driven suite for PS-092-05 matrix, including reviewer conflict cases.

## Failure, idempotency, concurrency, offline
Fault injection: enforcement outage, duplicate events, parallel decisions, draft restore offline.

## Privacy, retention, abuse
Leakage tests from PS-092-07 run in this suite.

## Observability & budgets
Load and alert tests from PS-092-08.

## Tests
- `TEST-PS-092-09-01` unit: transition table exhaustive.
- `TEST-PS-092-09-02` contract: schemas for all commands and events; body absent from events.
- `TEST-PS-092-09-03` integration: appeal reversal → enforcement reversal exactly once.
- `TEST-PS-092-09-04` integration: window boundary at 30 days ± 1 s.
- `TEST-PS-092-09-05` e2e (keyboard only): appellant submits, withdraws, and reads outcome with screen-reader labels (WCAG 2.1 AA, ASSUMPTION scope).
- `TEST-PS-092-09-06` property: no appeal reaches `closed` without passing `implemented` or `ineligible`/`withdrawn`.
- `TEST-PS-092-09-07` offline: draft persists across restart; no transmission before submit.

## Acceptance criteria
1. 100 % of transitions and error codes covered in CI.
2. Cross-module reversal test passes three consecutive runs.
3. Accessibility test passes for appellant screens.

## Assumptions & open decisions
- ASSUMPTION: `mod_enforcement` contract stub is provided by F12.S02.M01 before this suite runs.
- D08 (PWA offline writes), PROVISIONAL default applies to drafts (unapproved).
