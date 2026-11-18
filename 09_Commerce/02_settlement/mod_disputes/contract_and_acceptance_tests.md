# PS-070-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05, R12, R13, R16), CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-09.R01 | Contract tests cover every `clm.*` transition this module triggers, matching CTR-COM-001 state table. | MVP |
| PS-070-09.R02 | Window tests use a simulated clock covering day 13, 14 and 15 for each entry state. | MVP |
| PS-070-09.R03 | Accessibility: dispute form has labelled reason radio group, statement field with character count announced to screen readers, and error summary (WCAG 2.1 AA). | MVP |
| PS-070-09.R04 | Offline: draft survives restart; "Sent, waiting" state tested. | MVP |
| PS-070-09.R05 | Fixtures use synthetic parties and reserved test values only. | MVP |

## Data / schema
Fixtures: `fx_claim_claimed`, `fx_claim_attested`, `fx_claim_final`, `fx_dispute_open`, `fx_dispute_escalated`, `fx_case_grant_mod`.

## Commands / queries / events
Each command in PS-070-04 has happy-path and error-path contract tests.

## States & transitions
Table-driven tests for every row of PS-070-03.

## Validation & errors
Every row of PS-070-02 has one test (code, retryable, message key).

## Authorization
Every row of PS-070-05 matrix has one test.

## Failure, idempotency, concurrency, offline
Fault injection for claim-write failure, timer duplicate, outage past due date (PS-070-06).

## Privacy, retention, abuse
Canary and log scan on each merge; redaction job test at simulated 12 months.

## Observability & budgets
Latency tests nightly (PS-070-08).

## Tests
- TEST-PS-070-09-01 (contract): claim-state effects of raise, withdraw and resolve match CTR-COM-001 table.
- TEST-PS-070-09-02 (unit): window boundary days 13, 14, 15 for all four entry states.
- TEST-PS-070-09-03 (e2e): payer raises dispute on `FINAL` claim, payee responds, moderator resolves with `reverse`; claim becomes `REVERSED`.
- TEST-PS-070-09-04 (e2e): no response for 7 d; case auto-created; moderator resolves with `restore_prior`.
- TEST-PS-070-09-05 (a11y): keyboard-only raise flow; screen-reader announcement of character count.
- TEST-PS-070-09-06 (offline): draft kept across app restart; not shown as open before ack.
- TEST-PS-070-09-07 (property): for any sequence of raise, respond, withdraw, the claim state is always in the CTR-COM-001 state set.

## Acceptance criteria
1. TEST-PS-070-09-01 to -07 pass in CI (later phase).
2. Zero critical or serious accessibility violations.
3. Property test runs ≥ 10,000 generated sequences with no invariant violation.

## Assumptions & open decisions
- ASSUMPTION: simulated clock is used for all time-based tests.
- D04 (PROVISIONAL default, unapproved).
