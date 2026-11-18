# PS-033-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-10.R01 | Bidder exports own bids (JSON, `bids.bid` 1.0.0, ≤ 256 KB). | MVP |
| PS-033-10.R02 | Public auction archive export (CSV: sequence, amount_minor, currency, bidder_view, status) for closed auctions only. Contains no `acc_`. | MVP |
| PS-033-10.R03 | Backup restore preserves sequence order, amounts and statuses; restore never re-emits `bids.bid.accepted` events. | MVP |
| PS-033-10.R04 | Bid import is not supported. Requests are rejected with `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-033-10.R05 | Rollback never edits or deletes accepted bids on closed auctions. Corrections are `VOIDED` with case scope. | MVP |

## Data / schema
Export envelopes: `bids.bid.export` (own bids) and CSV archive header row fixed by schema version.

## Commands / queries / events
Exports are queries (`bid.read`). Emits `bids.exported` with count only.

## States & transitions
Not applicable. Restore runs under maintenance lock.

## Validation & errors
Digest mismatch on restore → `SYS.INTERNAL`, restore halted.

## Authorization
Own-bid export: bidder. Archive export: any user after close. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup digest. Exports are generated from a consistent snapshot (revision number recorded in the file).

## Privacy, retention, abuse
Exports link valid 15 min. Archive CSV is PUBLIC after close, so bidder_view is the only identifier. Export rate limit 5 per day per user.

## Observability & budgets
Restore ≤ 15 min for 10 million bids (ASSUMPTION). Metrics: `bids_exports_total{kind}`, `bids_restore_total{result}`.

## Tests
- TEST-PS-033-10-01 (integration): export → restore yields identical sequences and amounts.
- TEST-PS-033-10-02 (negative): archive CSV contains no `acc_` (scan).
- TEST-PS-033-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-033-10-04 (fault): restore does not emit accepted events.

## Acceptance criteria
1. Round-trip test passes.
2. Archive privacy scan passes on 1,000 closed auctions.
3. Rollback runbook has no step that edits accepted bids in place.

## Assumptions & open decisions
- ASSUMPTION: 15-minute download link expiry; no signed export in MVP.
- PROVISIONAL: D07 retention (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
