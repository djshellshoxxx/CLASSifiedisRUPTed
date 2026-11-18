# PS-034-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-07.R01 | Winner identity and close hash are PRIVATE_PERSONAL until confirmation, then FINANCIAL_EVIDENCE. `reserve_met` is PUBLIC. | MVP |
| PS-034-07.R02 | Close record is retained for the dispute window (14 days, CTR-COM-001 R16) plus 24 months (PROVISIONAL, D07 default); then `winner` is replaced by a tombstone token, amounts remain. | MVP |
| PS-034-07.R03 | Public archive of closed auctions contains end state, amounts and bidder pseudonyms only. | MVP |
| PS-034-07.R04 | Seller-linked winner detection (PS-034-02 R05) sends IDs and rule enum to F04.S02.M03 only. | MVP |
| PS-034-07.R05 | Cancellations per seller: ≤ 20 per 30 days before review flag (ASSUMPTION). | MVP |

## Data / schema
Retention fields: `retain_until`, `legal_hold` (F10 only), `tombstone_token`.

## Commands / queries / events
Retention job runs as `sys`; emits `auction.close_record.purged` with counts.

## States & transitions
ACTIVE → ARCHIVED (+14 days after terminal state) → PSEUDONYMIZED (+24 months). UNSOLD and CANCELLED records follow the same schedule.

## Validation & errors
Export or purge under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Winner and seller may export their own closed-auction records. Purge is `sys`.

## Failure, idempotency, concurrency, offline
Purge idempotent per record; never purges a record with an open confirmation or dispute.

## Privacy, retention, abuse
Abuse: shill-award (seller-linked winner), cancellation abuse to deny buyers, close-timing manipulation. Controls: R04, R05, server-only close. Pseudonyms do not hide the transaction from the two parties.

## Observability & budgets
Metrics: `close_seller_flags_total`, `close_cancellations_total`, `close_records_purged_total`. No winner identifiers in logs.

## Tests
- TEST-PS-034-07-01 (lint): field classes per R01; winner absent from public projection.
- TEST-PS-034-07-02 (integration): purge skipped while confirmation pending.
- TEST-PS-034-07-03 (integration): public archive contains no `acc_`.
- TEST-PS-034-07-04 (abuse): 21st cancellation in 30 days flags seller, no automatic ban.

## Acceptance criteria
1. Retention schedule matches R02.
2. Public archive privacy scan passes.
3. Seller flags contain no account identifiers.

## Assumptions & open decisions
- ASSUMPTION: 20 cancellations per 30 days threshold.
- PROVISIONAL: D07 retention default (unapproved). Legal periods OPEN. See [DECISIONS.md](../../../DECISIONS.md).
