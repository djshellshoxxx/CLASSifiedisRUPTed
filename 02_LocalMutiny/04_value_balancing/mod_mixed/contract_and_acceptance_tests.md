# PS-026-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-09.R01 | Contract tests run against CTR-COM-001 claim schema for every leg kind (six kinds). | MVP |
| PS-026-09.R02 | End-to-end test covers a two-party mixed-value barter from declaration to `clm.attested`, using a pinned quote. | MVP |
| PS-026-09.R03 | Negative tests cover every error code in PS-026-02 and every forbidden transition in PS-026-03. | MVP |
| PS-026-09.R04 | Accessibility test: leg list and gap summary are operable by keyboard and announced with amount, currency and direction. | MVP |

## Data / schema
Fixtures: `fixtures/mixed/two_party_cash.json`, `three_party_mixed_onchain.json`, `in_kind_limit.json` (names proposed; created in implementation phase). Each fixture pins its quote and snapshot hash.

## Commands / queries / events
Contract tests replay recorded events through CTR-EVT-001 validators.

## States & transitions
Each state in PS-026-03 has at least one positive and one negative test.

## Validation & errors
Error-code coverage report generated from the registry; fails below 100%.

## Authorization
Matrix tests from PS-026-05 are included in the contract suite.

## Failure, idempotency, concurrency, offline
Chaos cases: duplicate delivery, out-of-order events, quote expiry mid-declare, offline replay (D08).

## Privacy, retention, abuse
Fixtures use synthetic `acc_` IDs and no real payment references. Test logs pass the PS-026-08 scrub check.

## Observability & budgets
Suite runtime ≤ 10 min for contract tests on CI (ASSUMPTION).

## Tests
- TEST-PS-026-09-01 (contract): six leg kinds validate against CTR-COM-001 `method`.
- TEST-PS-026-09-02 (e2e): two-party cash leg, declare → consent → submit → attest.
- TEST-PS-026-09-03 (e2e): three-party cycle with one on-chain leg; verification stops at `EXTERNALLY_VERIFIED` only if adapter matches.
- TEST-PS-026-09-04 (a11y): gap summary and leg controls pass keyboard and screen-reader checks.
- TEST-PS-026-09-05 (property): random legs whose sums do not equal the gap always return `MIXED.GAP_NOT_BALANCED`.

## Acceptance criteria
1. All TEST-PS-026-09 tests pass in CI before release gate (future phase).
2. Error-code coverage is 100% for MIXED codes.
3. No test asserts a state named PAID.

## Assumptions & open decisions
- ASSUMPTION: adapter fixtures are recorded responses, not live chain calls.
- OPEN: which accessibility standard the CI check maps to (WCAG 2.1 AA assumed). See [DECISIONS.md](../../../DECISIONS.md) D04.
