# PS-034-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`auc`, `bid`, `trx`), CTR-COM-001 (transaction, claim, currency), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-01.R01 | Close record is keyed by `auc_` (one close record per auction, unique). It is written once and is append-only thereafter. | MVP |
| PS-034-01.R02 | Fields: `auc_id`, `end_state` ∈ {`SOLD`, `UNSOLD`, `CANCELLED`}, `end_reason` enum, `closed_at_utc` (server), `final_revision`, `winning_bid_id` (`bid_`, nullable), `winner` (`acc_`, nullable, hidden until confirmation), `winning_amount_minor` (nullable), `reserve_met` (boolean), `trx_id` (`trx_`, nullable), `close_hash` (SHA-256 of JCS of record). | MVP |
| PS-034-01.R03 | `end_reason` ∈ {`SOLD_HIGHEST_MEETS_RESERVE`, `SOLD_NO_RESERVE`, `UNSOLD_RESERVE_NOT_MET`, `UNSOLD_NO_BIDS`, `CANCELLED_BY_SELLER`, `CANCELLED_BY_OPERATOR`}. | MVP |
| PS-034-01.R04 | Reserve value is not a field of the close record. It stays in `mod_reserve`. Only `reserve_met` is stored here. | MVP |
| PS-034-01.R05 | Confirmation record: `winner_confirmed_at`, `winner_confirmation_hash`. Confirmation is a signed statement by the winner (D06 default), not payment evidence. | MVP |

## Data / schema
```json
{"auc_id": "auc_01HZ...", "end_state": "SOLD", "end_reason": "SOLD_HIGHEST_MEETS_RESERVE",
 "closed_at_utc": "2026-12-10T18:02:00Z", "final_revision": 57, "winning_bid_id": "bid_01HZ...",
 "winner": "acc_01HZ...", "winning_amount_minor": "15500", "reserve_met": true,
 "trx_id": null, "close_hash": "<64 hex>", "schema_version": "1.0.0"}
```
- Data classes: `winner` PRIVATE_PERSONAL; amounts and `trx_id` FINANCIAL_EVIDENCE; `end_state` PUBLIC; `reserve_met` PUBLIC.
- `winner` is null in any public projection until `winner_confirmed_at` is set.

## Commands / queries / events
Covered in PS-034-04. Schema ID: `auction.close` (1.0.0).

## States & transitions
Covered in PS-034-03.

## Validation & errors
Covered in PS-034-02.

## Authorization
Covered in PS-034-05.

## Failure, idempotency, concurrency, offline
Covered in PS-034-06.

## Privacy, retention, abuse
Covered in PS-034-07.

## Observability & budgets
Close job completes ≤ 5 s after effective end (PS-034-08).

## Tests
- TEST-PS-034-01-01 (unit): one close record per auction; second insert rejected.
- TEST-PS-034-01-02 (lint): no reserve amount field exists in close schema.
- TEST-PS-034-01-03 (lint): every field has one CTR-PRV-001 class; `winner` hidden in public projection.

## Acceptance criteria
1. `auction.close` registered in CTR-SCH-001.
2. Public projection contains no `winner` before confirmation (schema test).
3. `close_hash` reproduces on recomputation (JCS test).

## Assumptions & open decisions
- ASSUMPTION: close record stores final revision for replay.
- PROVISIONAL: confirmation statement per D06 default (signed statements only; unapproved). See [DECISIONS.md](../../../DECISIONS.md).
