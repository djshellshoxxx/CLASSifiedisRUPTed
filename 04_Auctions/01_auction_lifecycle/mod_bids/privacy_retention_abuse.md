# PS-033-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-07.R01 | Accepted amounts and `sequence` are PUBLIC; `bidder_view` is PSEUDONYMOUS; `bidder` (`acc_`) is PRIVATE_PERSONAL; `placed_at` is PRIVATE_PERSONAL until close, then retained as FINANCIAL_EVIDENCE within the close record. | MVP |
| PS-033-07.R02 | REJECTED bid rows are deleted 24 h after rejection. | MVP |
| PS-033-07.R03 | Accepted bids are retained with the auction for 24 months after close (PROVISIONAL, D07 default); then `bidder` is replaced by a tombstone token; amounts remain. | MVP |
| PS-033-07.R04 | Account deletion pseudonymizes the bidder link on all bids without changing amounts or sequences. | MVP |
| PS-033-07.R05 | Shill-bidding signals (seller-linked accounts bidding, bids from accounts created within the auction window) are forwarded to F04.S02.M03 `mod_fraud` as advisory counts with `bid_id`. | MVP |

## Data / schema
Retention fields: `retain_until`, `legal_hold` (F10 only), `tombstone_token` (nullable).

## Commands / queries / events
Retention and pseudonymization run as `sys` and emit `bids.bids.purged` with counts.

## States & transitions
ACTIVE → ARCHIVED (auction closed + 30 days) → PSEUDONYMIZED (+24 months). REJECTED → PURGED (+24 h).

## Validation & errors
Export or purge under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Bidder may export own bids (`bid.read`, self). Purge is `sys` only.

## Failure, idempotency, concurrency, offline
Purge idempotent per bid. Purge never runs on an open auction.

## Privacy, retention, abuse
Abuse: shill bidding, bid spam to block others, probing of reserve via bid patterns. Controls: R05 signals, rate limit (PS-033-02 R07), reserve status shown only as met/not met (F04.S01.M01). Pseudonyms do not hide bid patterns from the seller or from F04.S02.M03.

## Observability & budgets
Metrics: `bids_rate_limited_total`, `bids_shill_signals_total`, `bids_purged_total`. No `acc_` in logs.

## Tests
- TEST-PS-033-07-01 (lint): field classes match R01; `placed_at` absent from public events.
- TEST-PS-033-07-02 (integration): account deletion leaves amounts and sequence intact.
- TEST-PS-033-07-03 (integration): rejected bid purged after 24 h.
- TEST-PS-033-07-04 (abuse): seller-linked account bid produces one advisory signal with no `acc_`.

## Acceptance criteria
1. Retention job matches R02 and R03.
2. Deletion test preserves public history byte-for-byte except bidder link.
3. Shill signal contains no account identifiers.

## Assumptions & open decisions
- ASSUMPTION: 30-day archive window; 24-month retention; 24-hour rejected-bid retention.
- PROVISIONAL: D07 retention default (unapproved). Legal periods OPEN. See [DECISIONS.md](../../../DECISIONS.md).
