# PS-040-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-09. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** QA, implementation prompt (Prompt 4, after GO), review (Prompt 3).

## Purpose and scope
Define the contract tests, state tests, property tests and acceptance tests that prove the other nine specs. Each test has an ID, a fixture, and objective pass and fail criteria. This file adds no new behavior. Tests cover specification only; no test has been run, and no implementation exists.

## Requirements
- PS-040-09.R01: Business outcome: each requirement in PS-040-01 to PS-040-08 maps to at least one test with a pass or fail result. Exclusions: UI visual tests, load tests beyond the budget checks, and external settlement tests (not applicable, since no settlement exists on the platform).
- PS-040-09.R02: Case coverage: happy paths, every error code, every state transition, every timer, idempotent replay, concurrency races, and privacy scans.
- PS-040-09.R03: Accessibility and performance acceptance: client accessibility checks (labels, status announcements, contrast) on the deposit screens; server budgets from observability_performance.md.
- PS-040-09.R04: Contract tests run against the command and event schemas in commands_queries_events.md and fail on any undeclared field.
- PS-040-09.R05: Property tests cover the state machine: no transition leaves a terminal state; money conserves (returned + withheld = amount when settled); revision increases by exactly 1 per committed change.

## Fixtures
- F-1: Two participants (par_EXAMPLE_0001 depositor, par_EXAMPLE_0002 receiver) and one rental (rnt_EXAMPLE_0001) with rental_status values requested, confirmed, active, returned, cancelled.
- F-2: Currency fixtures EUR (exponent 2, cap 100000000 minor) and JPY (exponent 0, cap 1000000 minor).
- F-3: Moderator with dispute scope for one deposit; operator with flags only.
- F-4: Clock control set to 2026-11-10T09:00:00.000Z, with ability to advance time for each timer.
- F-5: Blocked participant fixture (F07 status blocked).
All identifiers are fixture placeholders. No real personal data appears in fixtures.

## Acceptance tests
| Test ID | Scenario | Pass | Fail |
|---|---|---|---|
| TEST-PS-040-09-T01 | Full path draft to settled: create, propose, accept, claim_paid, confirm_received, claim_return, confirm_return | Each step returns the table state; final state settled with returned_full; 7 events in order | Any step wrong, or missing or out-of-order event |
| TEST-PS-040-09-T02 | Counter loop: propose, counter, counter, accept | term_revision_no = 3; proposer swapped each time; accept by non-proposer only | Accept by proposer succeeds; or term revision count wrong |
| TEST-PS-040-09-T03 | Sixth counter attempt | DEPOSITS_STATE_COUNTER_LIMIT; state unchanged | Any other code or state change |
| TEST-PS-040-09-T04 | Each timer fires in its state | Each timer moves its deposit to the state in workflow_state_machine.md Timers table | Wrong target state or timer fires in wrong state |
| TEST-PS-040-09-T05 | Concurrent accept and cancel | Exactly one success; other returns 409 code | Both succeed or 500 |
| TEST-PS-040-09-T06 | Lost response then retry with same key | replayed = true; one event | Second event or changed response |
| TEST-PS-040-09-T07 | Non-party read returns same body as missing ID | Byte-identical 404 bodies except diagnostic_id | Bodies differ |
| TEST-PS-040-09-T08 | Revoked participant attempts propose | DEPOSITS_FORBIDDEN_REVOKED; no state change | Accepted |
| TEST-PS-040-09-T09 | Dispute path: open, moderator resolves withhold_upheld with withheld_minor = amount | settled with withheld_upheld; sums equal amount | Sum mismatch accepted or state wrong |
| TEST-PS-040-09-T10 | Partial settlement sum mismatch | DEPOSITS_VALIDATION_SETTLEMENT_SUM_MISMATCH | Accepted |
| TEST-PS-040-09-T11 | Undeclared field (party ID) in create | DEPOSITS_VALIDATION_FIELD_UNKNOWN | Accepted |
| TEST-PS-040-09-T12 | Client accessibility: deposit state screen | Each state has a text label; state change announced via live region; contrast ratio meets WCAG AA for text | Any state conveyed by color only, or a missing label |
| TEST-PS-040-09-T13 | Offline pending queue replays after 72 hours | Server refuses with a payload mismatch or revision code; no duplicate effect | Duplicate effect |

## Property tests
- PT-1: For random valid command sequences, no transition leaves settled, expired or cancelled. Pass: 0 violations in 10,000 runs.
- PT-2: For settled deposits, returned_minor + withheld_minor = amount_minor. Pass: 0 violations.
- PT-3: revision equals number of deposit_event rows for the deposit. Pass: 0 violations.

## Traceability
| Requirement file | Test IDs |
|---|---|
| PS-040-01 domain schema | TEST-PS-040-01-T01 to T03; T01 to T13 in acceptance |
| PS-040-02 validation | TEST-PS-040-02-T01 to T03; T10, T11 |
| PS-040-03 state machine | TEST-PS-040-03-T01 to T03; T02 to T05, PT-1 |
| PS-040-04 commands and events | TEST-PS-040-04-T01 to T03; T01, T06, T11 |
| PS-040-05 authorization | TEST-PS-040-05-T01 to T03; T07, T08 |
| PS-040-06 failure recovery | TEST-PS-040-06-T01 to T03; T05, T06, T13 |
| PS-040-07 privacy and abuse | TEST-PS-040-07-T01 to T03; T08 |
| PS-040-08 observability | TEST-PS-040-08-T01 to T03 |
| PS-040-10 import export | see import_export_backup_rollback.md test cases |

## Assumptions and open decisions
- A-deposits-27 applies to export tests; see import_export_backup_rollback.md.
- Open: test environment and CI wiring belong to the implementation prompt (Prompt 4). Not decided here.
- Open: contract test tooling choice is left to the implementation prompt.

## Test cases
- TEST-PS-040-09-T00: Verify that every requirement ID PS-040-01.R01 to PS-040-10.R99 listed in the registry maps to a test row above. Pass: no unmapped requirement. Fail: any unmapped requirement.
