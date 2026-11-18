# PS-033-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`bid` opaque, `auc` ulid), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001, CTR-COM-001 (currency object).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-01.R01 | Record type `bid` with ID `bid_<26 base32>`, class opaque (CTR-ID-001 registry). | MVP |
| PS-033-01.R02 | Fields: `bid_id`, `auc_id` (`auc_`), `bidder` (`acc_`, never returned by API), `bidder_view` (`prf_`), `amount_minor` (decimal string > 0), `currency` (equal to auction currency, CTR-COM-001 object), `auction_revision` (revision at placement), `sequence` (server-assigned position in auction, from CTR-EVT-001 revision), `status`, `placed_at` (server UTC, stored, not exposed in MVP API). | MVP |
| PS-033-01.R03 | `status` ∈ {`ACCEPTED`, `OUTBID`, `REJECTED`, `VOIDED`}. `REJECTED` rows are not stored beyond 24 h (PS-033-07). | MVP |
| PS-033-01.R04 | Bidding has no currency conversion. A bid in any currency other than the auction currency is rejected. | MVP |
| PS-033-01.R05 | Canonical owner of bid records: F04.S01.M02 (this module). Canonical owner of auction records: F04 (`auc_`). | MVP |

## Data / schema
```json
{"bid_id": "bid_01HZ...", "auc_id": "auc_01HZ...", "bidder": "acc_01HZ...", "bidder_view": "prf_01HZ...",
 "amount_minor": "15500", "currency": {"kind": "fiat", "code": "EUR", "exponent": 2},
 "auction_revision": 42, "sequence": 17, "status": "ACCEPTED", "placed_at": "2026-12-01T18:00:00.123Z",
 "schema_version": "1.0.0"}
```
- Data classes: `amount_minor` and `sequence` PUBLIC after acceptance; `bidder_view` PSEUDONYMOUS; `bidder` PRIVATE_PERSONAL; `placed_at` PRIVATE_PERSONAL until auction close.
- Append-only: status changes are new events; the row is not overwritten.

## Commands / queries / events
Covered in PS-033-04. Schema ID: `bids.bid` (1.0.0).

## States & transitions
Covered in PS-033-03.

## Validation & errors
Covered in PS-033-02.

## Authorization
Covered in PS-033-05.

## Failure, idempotency, concurrency, offline
Covered in PS-033-06.

## Privacy, retention, abuse
Covered in PS-033-07.

## Observability & budgets
Bid write p95 ≤ 200 ms (PS-033-08).

## Tests
- TEST-PS-033-01-01 (unit): `amount_minor` accepts up to 999999999999999; rejects 0, leading zeros, decimals.
- TEST-PS-033-01-02 (lint): API response schemas exclude `bidder` and `placed_at` in MVP.
- TEST-PS-033-01-03 (lint): every field has one CTR-PRV-001 class.

## Acceptance criteria
1. `bid` prefix present in CTR-ID-001 registry with class opaque.
2. No API response contains `acc_` IDs of bidders (schema scan).
3. Currency always equals auction currency (integration test).

## Assumptions & open decisions
- ASSUMPTION: bid amounts ≤ 10^15 − 1 minor units.
- PROVISIONAL: D03 integer minor units (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
