# PS-035-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-03.R01 | Reserve states: `UNSET`, `SET`, `MET`. | MVP |
| PS-035-03.R02 | `MET` is one-way and terminal for edits: once `MET`, no change is accepted. | MVP |
| PS-035-03.R03 | `MET` is set at the moment an ACCEPTED bid's amount ≥ `reserve_minor` (same transaction as bid acceptance). | MVP |
| PS-035-03.R04 | `reserve_status` public projection: `NONE` (UNSET or reserve 0), `NOT_MET` (SET and no qualifying bid), `MET`. | MVP |

## Data / schema
`reserve_state` and `set_at_revision` on the auction embedded reserve. Changes are rows in reserve history.

## Commands / queries / events
Transitions from `reserve.set`, `reserve.lower`, and from `bids.bid.accepted` (sets MET).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| UNSET | reserve.set | Validation passes | SET | History row; `auction.reserve.set` event (no value) |
| SET | reserve.set (new > old) | No ACCEPTED bid | SET | History row; event |
| SET | reserve.lower (new < old) | State SET; OPEN | SET | History row; event; re-evaluate MET |
| SET | bids.bid.accepted | Bid amount ≥ reserve | MET | Same transaction; event `auction.reserve.met` (no value) |
| SET | reserve.set (new = old) | Any | SET | No-op, idempotent |
| UNSET, SET | reserve.set to 0 | OPEN | UNSET | History row; event |

Forbidden transitions return `RESERVE.LOCKED` (422, not retryable).

## Validation & errors
`RESERVE.LOCKED` for edits after MET or after close. `RESERVE.RAISE_AFTER_BID` for raises after bids.

## Authorization
Seller changes reserve; system sets MET (`auc.execute`, scope `global`, no content read beyond comparison).

## Failure, idempotency, concurrency, offline
MET set in the same transaction as bid acceptance: no bid can be accepted without MET being set when it qualifies (PS-035-06). Duplicate `reserve.set` with same value is a no-op.

## Privacy, retention, abuse
`auction.reserve.met` event carries `auc_` only; bidders learn "reserve met" status, not the value.

## Observability & budgets
Metrics: `reserve_transitions_total{from,to}`; `reserve_met_lag_seconds` = 0 (same transaction; alert on any lag).

## Tests
- TEST-PS-035-03-01 (unit): every row in the table; other pairs rejected.
- TEST-PS-035-03-02 (property): once MET, any change request is rejected (1,000 random sequences).
- TEST-PS-035-03-03 (integration): bid equal to reserve sets MET in the same transaction.
- TEST-PS-035-03-04 (negative): event payloads contain no reserve value (lint).

## Acceptance criteria
1. MET-lock property passes with zero violations.
2. No MET lag observed in integration tests.
3. Public projection values match the table in all fixtures.

## Assumptions & open decisions
- ASSUMPTION: lowering a reserve is allowed while SET and OPEN.
- OPEN: whether lowering a reserve below the current high bid should be allowed. See [DECISIONS.md](../../../DECISIONS.md) D03.
