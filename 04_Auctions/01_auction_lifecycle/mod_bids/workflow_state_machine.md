# PS-033-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-03.R01 | Bid states: `ACCEPTED`, `OUTBID`, `REJECTED`, `VOIDED`. `ACCEPTED` → `OUTBID` is the only change under normal operation. | MVP |
| PS-033-03.R02 | Exactly one bid per auction is non-OUTBID and highest at any revision. | MVP |
| PS-033-03.R03 | No bidder withdrawal in MVP. Only an operator void with case scope may set `VOIDED` (shill or fraud), which emits a recalculation of the high bid. | MVP |
| PS-033-03.R04 | No bid transition is allowed once the auction is CLOSING or closed (F04.S01.M03). | MVP |

## Data / schema
`status` on the bid row; `auction_revision` and `sequence` immutable.

## Commands / queries / events
Transitions from `bids.place` (creates ACCEPTED or REJECTED), from accepting a higher bid (ACCEPTED → OUTBID of previous high), and from `bids.void` (case scope).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | bids.place | Validation passes under lock | ACCEPTED | Previous high → OUTBID; emit `bids.bid.accepted` |
| (none) | bids.place | Validation fails | REJECTED (not persisted beyond 24 h) | Return error |
| ACCEPTED | higher bid accepted | New sequence greater | OUTBID | Emit `bids.bid.outbid` to previous bidder pseudonym |
| ACCEPTED, OUTBID | bids.void | ope with case scope, dual control | VOIDED | Recalculate high; emit `bids.bid.voided` |

Forbidden transitions return `BIDS.INVALID_TRANSITION` (409, not retryable).

## Validation & errors
`BIDS.INVALID_TRANSITION` (conflict; from-state enum only). `BIDS.AUCTION_NOT_OPEN` for bids after close.

## Authorization
Placement by eligible bidder (`bid.create`). Void by operator with case scope (`bid.void`). Transitions to OUTBID are system actions.

## Failure, idempotency, concurrency, offline
Placement serialized by the auction lock (CTR-EVT-001 revision CAS). A void recalculates high under the same lock. Outbid notifications are at-least-once and idempotent per (bid_id, event).

## Privacy, retention, abuse
Outbid notifications name the new high amount only if the auction publishes amounts (it does, PS-033-07 R01) and never name `acc_` IDs.

## Observability & budgets
Metrics: `bids_transitions_total{from,to}`; `bids_lock_wait_seconds` p99 ≤ 50 ms.

## Tests
- TEST-PS-033-03-01 (unit): every row in the table; other pairs rejected.
- TEST-PS-033-03-02 (property): after any sequence of 1,000 random placements, exactly one non-OUTBID bid exists and it is the highest amount.
- TEST-PS-033-03-03 (integration): void recalculates high correctly when the highest bid is voided.
- TEST-PS-033-03-04 (negative): bid after CLOSING returns `BIDS.AUCTION_NOT_OPEN`.

## Acceptance criteria
1. Property test R02 passes with zero violations.
2. No withdrawal path exists in MVP API (contract test).
3. Void requires two approvers.

## Assumptions & open decisions
- ASSUMPTION: no bidder withdrawal in MVP.
- Proxy (max) bidding is deferred to Future scope; no spec in this module. See [DECISIONS.md](../../../DECISIONS.md) D03.
