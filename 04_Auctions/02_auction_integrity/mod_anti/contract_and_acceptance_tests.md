# PS-036-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-09.R01 | Contract tests validate all commands and events against CTR-SCH-001. | MVP |
| PS-036-09.R02 | Property tests: monotonic `effective_end`, cap never exceeded, out-of-order equivalence. | MVP |
| PS-036-09.R03 | Boundary tests at window start, window end and cap. | MVP |
| PS-036-09.R04 | Accessibility: schedule change (extension) announced to screen readers in the auction view. | MVP |

## Data / schema
Fixtures: `fixtures/anti/late_bid_chain.json`, `cap_reached.json`, `out_of_order_permutations.json` (names proposed; created in implementation phase). Synthetic accounts only.

## Commands / queries / events
Replay of recorded bid logs through the evaluator.

## States & transitions
Each state in PS-036-03 has positive and negative tests.

## Validation & errors
100% coverage of ANTISNIP codes.

## Authorization
Matrix tests from PS-036-05.

## Failure, idempotency, concurrency, offline
Chaos: duplicate events, consumer outage, process crash between writes.

## Privacy, retention, abuse
Fixtures use placeholder IDs only.

## Observability & budgets
Suite ≤ 5 min in CI (ASSUMPTION).

## Tests
- TEST-PS-036-09-01 (contract): all commands and events validate.
- TEST-PS-036-09-02 (property): 10,000 random sequences satisfy monotonicity and cap.
- TEST-PS-036-09-03 (boundary): bid at window start extends; one millisecond before does not.
- TEST-PS-036-09-04 (e2e): auction with late bids reaches cap and closes at final effective end.
- TEST-PS-036-09-05 (a11y): extension announcement passes screen-reader checks.

## Acceptance criteria
1. All property and boundary tests pass.
2. E2E cap scenario passes.
3. Error-code coverage 100%.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as CI accessibility mapping.
- OPEN: maximum total auction duration (base end plus extensions) for product policy. See [DECISIONS.md](../../../DECISIONS.md) D03.
