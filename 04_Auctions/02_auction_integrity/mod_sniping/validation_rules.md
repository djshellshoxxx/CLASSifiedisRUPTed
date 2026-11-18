# PS-038-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-02.R01 | Reject a timing record whose `auction_id` does not exist with `SNIPE.AUCTION_NOT_FOUND` (404). | MVP |
| PS-038-02.R02 | Reject a bid whose `server_received_at` is >= `close_at_snapshot` with acceptance `REJECTED_AFTER_CLOSE`; this is a recorded outcome, not an error to the bidder beyond the bid rejection message. | MVP |
| PS-038-02.R03 | If `clock_status` is DEGRADED, class is set to UNCLASSIFIED; no SNIPE or LATE label is assigned. | MVP |
| PS-038-02.R04 | `client_sent_at` more than 60 s in the future or 24 h in the past is dropped (stored as null) with `SNIPE.CLIENT_HINT_DROPPED`. Not an error. | MVP |
| PS-038-02.R05 | `bid_id` already recorded for the auction returns the existing `timing_id` (HTTP 200). | MVP |

## Data / schema
Field bounds per PS-038-01. `seconds_before_close` must equal the server-computed value to the ms rounded down; mismatch → `SNIPE.TIMING_MISMATCH` (internal).

## Commands / queries / events
Validation precedes persistence; rejected records go to the rule-audit stream only.

## States & transitions
Validation is stateless. Class assignment rules are in PS-038-03.

## Validation & errors
| Code | Retryable | Message key | Diagnostic |
|---|---|---|---|
| SNIPE.AUCTION_NOT_FOUND | false | sniping.err.auction | auction_id not found |
| SNIPE.BID_NOT_IN_AUCTION | false | sniping.err.bid | bid/auction mismatch |
| SNIPE.TIMING_MISMATCH | true | sniping.err.retry | recompute from server time |
| SNIPE.CLOCK_DEGRADED | true | sniping.info.clock | returned as status, not failure |
| SNIPE.CLIENT_HINT_DROPPED | false | none | info only |

## Authorization
Validation runs after `sniping.record` capability check (PS-038-05).

## Failure, idempotency, concurrency, offline
Deterministic and side-effect free. Offline clients send only `bid_id`; server computes all time fields.

## Privacy, retention, abuse
Diagnostics never include `bidder_id` or times. Dropped-hint counts are aggregated.

## Observability & budgets
Count drops and mismatches by code. Validation p95 <= 2 ms.

## Tests
- TEST-PS-038-02-01 (unit): each code raised for its fixture.
- TEST-PS-038-02-02 (boundary): bid at exactly close_at_snapshot is REJECTED_AFTER_CLOSE.
- TEST-PS-038-02-03 (property): client hints in the future or >24 h past are always dropped.

## Acceptance criteria
1. Every code has retryability and message key.
2. Close boundary test passes at ms precision.
3. Clock-degraded fixture never yields SNIPE or LATE.

## Assumptions & open decisions
- ASSUMPTION: 60 s future and 24 h past bounds for client hints.
- PROVISIONAL (no Dxx): exact-close bid is rejected (half-open interval).
