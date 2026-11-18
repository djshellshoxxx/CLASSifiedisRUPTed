# PS-035-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-02.R01 | `reserve_minor` matches `^(0|[1-9][0-9]{0,14})$`. Otherwise `RESERVE.AMOUNT_INVALID`. | MVP |
| PS-035-02.R02 | `reserve_minor` ≥ opening price when opening price > 0. Otherwise `RESERVE.BELOW_OPENING`. | MVP |
| PS-035-02.R03 | Currency equals auction currency. Otherwise `RESERVE.CURRENCY_MISMATCH`. | MVP |
| PS-035-02.R04 | Raising the reserve (new > old) is allowed only while no ACCEPTED bid exists. Otherwise `RESERVE.RAISE_AFTER_BID`. | MVP |
| PS-035-02.R05 | Changes are allowed only while auction is OPEN (server time) and `reserve_state` is not `MET`. Otherwise `RESERVE.LOCKED`. | MVP |
| PS-035-02.R06 | At most 5 reserve changes per auction (ASSUMPTION). Excess → `SYS.RATE_LIMITED`. | MVP |
| PS-035-02.R07 | Only the seller may set or change a reserve. Enforced in PS-035-05. | MVP |

## Data / schema
Validation reads the auction at its current revision under the auction lock. Change history is written only after validation passes.

## Commands / queries / events
Enforced by `reserve.set` and `reserve.lower`.

## States & transitions
Not applicable. Failed validation writes no history row.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| RESERVE.AMOUNT_INVALID | false | validation / 400 | field path |
| RESERVE.BELOW_OPENING | false | validation / 400 | none (opening price not echoed) |
| RESERVE.CURRENCY_MISMATCH | false | validation / 400 | currency class |
| RESERVE.RAISE_AFTER_BID | false | unprocessable_state / 422 | none |
| RESERVE.LOCKED | false | unprocessable_state / 422 | state enum (`MET`, `CLOSED`) |

R06 uses `SYS.RATE_LIMITED`. Messages `err.reserve.<code>`. Reserve and bids values are never echoed.

## Authorization
Runs after PS-035-05.

## Failure, idempotency, concurrency, offline
Deterministic at a given revision. A raise racing a bid is serialized by the auction lock: if the bid commits first, the raise fails with `RESERVE.RAISE_AFTER_BID`.

## Privacy, retention, abuse
Error bodies never reveal whether the reserve has been met unless the caller is the seller. Repeated change attempts feed a probing signal (PS-035-07).

## Observability & budgets
Validation ≤ 5 ms p95. Metric `reserve_validation_rejections_total{code}`.

## Tests
- TEST-PS-035-02-01 (unit): one failing input per code.
- TEST-PS-035-02-02 (boundary): reserve equal to opening price accepted; one minor unit below rejected.
- TEST-PS-035-02-03 (concurrency): raise and bid race → exactly one wins; the other gets the correct code.
- TEST-PS-035-02-04 (property): sixth change rejected with `SYS.RATE_LIMITED`.

## Acceptance criteria
1. All RESERVE codes registered in CTR-ERR-001 lint.
2. Boundary and race tests pass.
3. No error body contains reserve or opening values.

## Assumptions & open decisions
- ASSUMPTION: 5 changes per auction; raise allowed only before first accepted bid.
- See [DECISIONS.md](../../../DECISIONS.md) D03 (PROVISIONAL, unapproved).
