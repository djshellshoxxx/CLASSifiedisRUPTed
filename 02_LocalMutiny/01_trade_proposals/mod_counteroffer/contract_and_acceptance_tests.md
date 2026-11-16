# PS-012-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope tests), CTR-EVT-001 (event tests), CTR-CAP-001 (authorization tests), CTR-COM-001 (quote and amount tests), CTR-SCH-001 (schema tests).

**Decision label:** Test fixtures are ASSUMPTION; no test run has been performed. Accessibility targets are ASSUMPTION pending QA Lead review.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-09.R01 | Every test in this file has a stable ID `TEST-PS-012-09-nn` and runs in CI without network access except to fixture services. | MVP |
| PS-012-09.R02 | Contract tests validate every error and event against the canonical schemas in CTR-ERR-001 and CTR-EVT-001. | MVP |
| PS-012-09.R03 | Acceptance tests cover each row of PS-012-03 transitions and each rule in PS-012-02. | MVP |

## Tests
- TEST-PS-012-09-01 (contract, CTR-ERR-001): every `CTROFFER.*` code has retryable, category and `message_key` matching the registry.
- TEST-PS-012-09-02 (contract, CTR-EVT-001): each `counter.*` event passes envelope, `max_data_class` and 64 KiB limit checks; no `SECRET` class.
- TEST-PS-012-09-03 (contract, CTR-CAP-001): non-participant `acc_` receives `SYS.NOT_FOUND` identical to a missing `cyc_`.
- TEST-PS-012-09-04 (acceptance): full transition table, one test per row, including supersede inside create.
- TEST-PS-012-09-05 (property): for any sequence of 100 random commands, at most one OPEN counter per `cyc_` and revision ≤ 5.
- TEST-PS-012-09-06 (integration, quote): accept with expired quote fails `COM.QUOTE_EXPIRED`; pinned amount unchanged (CTR-COM-001.R04).
- TEST-PS-012-09-07 (integration, concurrency): accept and supersede on the same counter race 1000 times; exactly one outcome per run.
- TEST-PS-012-09-08 (offline): queued accept after item taken is rejected at commit with `CTROFFER.COUNTER_INVALIDATED`.
- TEST-PS-012-09-09 (a11y): accept, reject and withdraw are keyboard-operable; state labels are announced; contrast ≥ 4.5:1 (WCAG 2.1 AA).
- TEST-PS-012-09-10 (e2e): two-person counter loop from offer to accept reaches revision 2 and `cyc_` shows agreed revision.

## Acceptance criteria
1. All ten PS-012-09 test IDs have a fixture file under the module test directory before implementation starts.
2. Contract tests fail on any schema drift against CTR-ERR-001 or CTR-EVT-001.
3. Accept with an expired quote never changes `cyc_` revision.
4. No test asserts "paid", "settled" or handover (CTR-COM-001.R15).

## Assumptions & open decisions
- ASSUMPTION: test fixtures use synthetic `acc_`, `lst_` and `cyc_` IDs only.
- D03 PROVISIONAL (D03 default, unapproved): golden vectors for `HALF_EVEN` rounding per CTR-COM-001.R04.
- PENDING: QA Lead (F17) assignment of the test environment.
