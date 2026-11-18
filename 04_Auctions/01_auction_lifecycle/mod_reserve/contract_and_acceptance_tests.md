# PS-035-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-09.R01 | Contract tests validate all commands and events against CTR-SCH-001. | MVP |
| PS-035-09.R02 | Invariant tests: MET iff qualifying bid exists; no raise after first bid; no change after MET. | MVP |
| PS-035-09.R03 | Negative tests scan every public and bidder-facing response for reserve values. | MVP |
| PS-035-09.R04 | Accessibility: "reserve met" and "reserve not met" status announced in the auction header. | MVP |

## Data / schema
Fixtures: `fixtures/reserve/no_reserve.json`, `reserve_equal_bid.json`, `reserve_one_unit_below.json`, `raise_race.json` (names proposed; created in implementation phase). Synthetic accounts only.

## Commands / queries / events
Recorded bid events replayed against reserve state.

## States & transitions
Each state in PS-035-03 has positive and negative tests.

## Validation & errors
100% coverage of RESERVE codes.

## Authorization
Matrix tests from PS-035-05.

## Failure, idempotency, concurrency, offline
Chaos: race between raise and bid, duplicate commands, offline ack after first bid.

## Privacy, retention, abuse
Fixtures use synthetic reserve values; scans verify absence in responses.

## Observability & budgets
Suite ≤ 5 min in CI (ASSUMPTION).

## Tests
- TEST-PS-035-09-01 (contract): all commands and events validate.
- TEST-PS-035-09-02 (property): invariant R02 across 1,000 random sequences.
- TEST-PS-035-09-03 (boundary): equal bid sets MET; one unit below does not.
- TEST-PS-035-09-04 (negative): response scan finds no reserve value for non-seller callers.
- TEST-PS-035-09-05 (a11y): status announcement passes checks.

## Acceptance criteria
1. Invariant and boundary tests pass.
2. Zero reserve values in non-seller responses across the scan.
3. Error-code coverage 100%.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as CI accessibility mapping.
- OPEN: display of reserve status before first bid. See [DECISIONS.md](../../../DECISIONS.md) D10.
