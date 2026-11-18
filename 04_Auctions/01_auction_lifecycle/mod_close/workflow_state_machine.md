# PS-034-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (transaction handoff; claim states after handoff), CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-03.R01 | Auction close states owned here: `OPEN` (not in this module), `CLOSING`, `ENDED_SOLD`, `ENDED_UNSOLD`, `ENDED_CANCELLED`, `CONFIRMED`, `UNCONFIRMED`. | MVP |
| PS-034-03.R02 | `ENDED_SOLD` → `CONFIRMED` requires winner confirmation within 48 hours (ASSUMPTION). Else `UNCONFIRMED`. | MVP |
| PS-034-03.R03 | `trx_` (CTR-COM-001 transaction) is created only on `CONFIRMED`. No claim (`clm_`) is created by this module. | MVP |
| PS-034-03.R04 | No state, label or event names a payment as made, received, paid or settled. | MVP |
| PS-034-03.R05 | `UNCONFIRMED` is terminal for the auction. Routing to a runner-up is Future scope and has no spec in this module. | MVP |

## Data / schema
`auction_state` on the auction row (F04); close record (PS-034-01) is written at `ENDED_*`. Confirmation timer stored as `confirm_due_at`.

## Commands / queries / events
Transitions from `close.run`, `auction.cancel`, `close.confirm_winner`, and the confirmation timer.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| OPEN | close.run (timer) | now ≥ effective end | CLOSING | Freeze bids (PS-033-03 R04) |
| CLOSING | close.run | Validation passes (PS-034-02) | ENDED_SOLD | Write close record; `confirm_due_at` = now + 48 h; notify winner and seller |
| CLOSING | close.run | No accepted bid or reserve not met | ENDED_UNSOLD | Write close record; notify seller |
| OPEN | auction.cancel | Seller; zero accepted bids | ENDED_CANCELLED | Write record; notify |
| OPEN | auction.cancel_operator | `ope`/`mod` with case scope | ENDED_CANCELLED | Dual control; write record |
| ENDED_SOLD | close.confirm_winner | Winner; hash matches | CONFIRMED | Create `trx_` (F09) in same transaction |
| ENDED_SOLD | timer (confirm_due_at) | No confirmation | UNCONFIRMED | Notify both; no trx |

Forbidden transitions return `CLOSE.INVALID_TRANSITION` (409, not retryable).

## Validation & errors
`CLOSE.INVALID_TRANSITION` with from-state enum diagnostic only.

## Authorization
System for close and timers; seller for seller cancel; winner for confirmation; `case` scope for operator cancel.

## Failure, idempotency, concurrency, offline
Close and confirm are CAS on `final_revision` and on `close_hash`. `CONFIRMED` requires `trx_` creation and state change in one transaction (outbox for events). If F09 is unavailable at confirm, the confirm fails with `SYS.UNAVAILABLE` and the state remains `ENDED_SOLD`; retry is safe.

## Privacy, retention, abuse
Notifications to the seller name the winner only after confirmation. Timer and notification payloads contain no amounts in push previews (CTR-PRV-001).

## Observability & budgets
Metrics: `close_transitions_total{from,to}`; `close_confirm_pending_total`; alert when `ENDED_SOLD` older than 48 h + 1 h.

## Tests
- TEST-PS-034-03-01 (unit): every row in table; other pairs rejected.
- TEST-PS-034-03-02 (integration): no confirmation within 48 h → UNCONFIRMED, no `trx_`.
- TEST-PS-034-03-03 (fault): F09 down at confirm → `SYS.UNAVAILABLE`; retry after recovery creates exactly one `trx_`.
- TEST-PS-034-03-04 (negative): no state or label contains "paid" or "settled" (lint).

## Acceptance criteria
1. State table complete; lint enumerates states.
2. Exactly one `trx_` per CONFIRMED auction in fault suite.
3. Zero `clm_` records created by this module (contract test).

## Assumptions & open decisions
- ASSUMPTION: 48 h winner confirmation window.
- PROVISIONAL: D04 partial execution and D09 no-custody defaults (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
