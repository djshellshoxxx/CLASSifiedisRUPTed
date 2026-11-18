# PS-033-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-09.R01 | Contract tests validate every command and event against CTR-SCH-001. | MVP |
| PS-033-09.R02 | Concurrency suite: 1,000 concurrent placements on one auction, checked for ordering and highest-bid correctness. | MVP |
| PS-033-09.R03 | Increment boundary and currency-mismatch cases for every BIDS code. | MVP |
| PS-033-09.R04 | Accessibility: bid control announces amount, currency and current high; error messages announced in the form. | MVP |

## Data / schema
Fixtures: `fixtures/bids/open_auction_ladder.json`, `concurrent_1000.json`, `shill_pattern.json` (names proposed; created in implementation phase). Synthetic accounts only.

## Commands / queries / events
Event replay validates sequence monotonicity.

## States & transitions
Each state in PS-033-03 has positive and negative tests.

## Validation & errors
100% coverage of BIDS codes.

## Authorization
Matrix tests from PS-033-05.

## Failure, idempotency, concurrency, offline
Chaos: lock lease expiry, duplicate events, offline ack after close.

## Privacy, retention, abuse
Fixtures contain no real identifiers. Test traces scrubbed per PS-033-08.

## Observability & budgets
Concurrency suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-033-09-01 (contract): all commands and events validate.
- TEST-PS-033-09-02 (concurrency): 1,000 parallel bids, zero duplicate sequences, highest bid correct.
- TEST-PS-033-09-03 (boundary): increment at exactly 5% and at 5% minus one unit.
- TEST-PS-033-09-04 (a11y): bid control and error announcements pass screen-reader checks.
- TEST-PS-033-09-05 (negative): public history contains no `acc_` in 10,000 generated auctions.

## Acceptance criteria
1. TEST-PS-033-09-02 passes with zero violations.
2. Error-code coverage 100%.
3. Privacy scan passes.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as CI accessibility mapping.
- OPEN: minimum-increment rule for very high-value auctions. See [DECISIONS.md](../../../DECISIONS.md) D03.
