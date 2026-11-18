# PS-033-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-02.R01 | `amount_minor` matches `^[1-9][0-9]{0,14}$`. Otherwise `BIDS.AMOUNT_INVALID`. | MVP |
| PS-033-02.R02 | `amount_minor` ≥ current high + minimum increment. Minimum increment = max(1 minor unit, ceil(5% of current high)) (ASSUMPTION). Opening bid ≥ opening price. Otherwise `BIDS.AMOUNT_BELOW_INCREMENT`. | MVP |
| PS-033-02.R03 | Auction state must be OPEN at server time (not client time). Otherwise `BIDS.AUCTION_NOT_OPEN`. | MVP |
| PS-033-02.R04 | Currency must equal auction currency. Otherwise `BIDS.CURRENCY_MISMATCH`. | MVP |
| PS-033-02.R05 | `bidder` ≠ auction seller and not a sold-to-self link. Otherwise `BIDS.SELLER_CANNOT_BID`. | MVP |
| PS-033-02.R06 | Bidder must hold an active session and not be suspended (F07, F12). Otherwise `BIDS.BIDDER_NOT_ELIGIBLE`. | MVP |
| PS-033-02.R07 | Rate limit: 1 bid per 3 s per bidder per auction, 30 bids per hour per bidder. Excess → `SYS.RATE_LIMITED`. | MVP |
| PS-033-02.R08 | Client-supplied timestamps are ignored. Ordering uses server sequence. | MVP |

## Data / schema
Validation reads the auction at its current revision inside the placement lock (PS-033-06).

## Commands / queries / events
Enforced by `bids.place` before persistence.

## States & transitions
Not applicable. Failed validation writes nothing.

## Validation & errors
| Code | Retryable | Category / HTTP | Diagnostic |
|---|---|---|---|
| BIDS.AMOUNT_INVALID | false | validation / 400 | field path |
| BIDS.AMOUNT_BELOW_INCREMENT | false | unprocessable_state / 422 | none (no current high echoed) |
| BIDS.AUCTION_NOT_OPEN | false | unprocessable_state / 422 | auction state enum |
| BIDS.CURRENCY_MISMATCH | false | validation / 400 | currency class |
| BIDS.SELLER_CANNOT_BID | false | forbidden / 403 | none |
| BIDS.BIDDER_NOT_ELIGIBLE | false | forbidden / 403 | reason enum |

`SYS.RATE_LIMITED` (retryable true) is reused for R07. Messages `err.bids.<code>`.

## Authorization
Validation runs after PS-033-05. A hidden auction returns `SYS.NOT_FOUND` before any rule runs.

## Failure, idempotency, concurrency, offline
Deterministic at a given auction revision. A bid rejected because the high moved returns `BIDS.AMOUNT_BELOW_INCREMENT` with a retry hint to re-read the auction; it is never silently re-priced.

## Privacy, retention, abuse
Error bodies never include the current high bid when the bidder is not eligible. Rule failures per bidder feed the shill-bidding signal (PS-033-07).

## Observability & budgets
Validation ≤ 5 ms p95 inside lock. Metric `bids_validation_rejections_total{code}`.

## Tests
- TEST-PS-033-02-01 (unit): one failing input per code.
- TEST-PS-033-02-02 (boundary): bid exactly at minimum increment accepted; one unit less rejected.
- TEST-PS-033-02-03 (negative): bid in EUR on a USD auction rejected.
- TEST-PS-033-02-04 (property): 4th bid within 3 s rejected with `SYS.RATE_LIMITED`.

## Acceptance criteria
1. All BIDS codes registered in CTR-ERR-001 lint.
2. Integer-only comparisons; no float path.
3. Seller bid rejected in 100% of fixture cases.

## Assumptions & open decisions
- ASSUMPTION: 5% minimum increment with 1-unit floor; 3 s and 30/hour rate limits.
- Auction timing and extension are owned by F04.S02.M01 (see that spec). See [DECISIONS.md](../../../DECISIONS.md) D03.
