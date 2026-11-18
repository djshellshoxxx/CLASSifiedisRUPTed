# PS-035-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-06.R01 | Reserve changes and bid acceptance serialize under the auction lock; no interleaving can leave a qualifying bid without MET. | MVP |
| PS-035-06.R02 | Duplicate `reserve.set` with same key returns the original result; no second history row. | MVP |
| PS-035-06.R03 | MET write and bid acceptance commit in one transaction (PS-035-03 R03). | MVP |
| PS-035-06.R04 | Offline reserve edits are queued (D08) and validated on acknowledgement; if the auction has a bid by then, a raise is rejected and a lower is validated against the current state. | MVP |

## Data / schema
Idempotency record per (seller, command, key, digest). History row written with the change.

## Commands / queries / events
Events emitted via outbox; `auction.reserve.met` is emitted exactly once per auction.

## States & transitions
No recovery path returns MET to SET.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED`. Non-retryable: `RESERVE.RAISE_AFTER_BID`, `RESERVE.LOCKED`, `SYS.CONFLICT` (re-read needed).

## Authorization
System comparison runs as `sys`.

## Failure, idempotency, concurrency, offline
- Crash between bid commit and MET write: impossible by R03; if the store lacks atomicity, reconciliation sets MET for any ACCEPTED bid ≥ reserve within 1 min (fallback, ASSUMPTION).
- Timeout on `reserve.set`: retry with same key.
- Offline: queued edits never display as applied until ack.

## Privacy, retention, abuse
Recovery logs contain IDs and codes only.

## Observability & budgets
Metrics: `reserve_met_reconciliation_total` (must be 0 in steady state); `reserve_duplicate_history_total` (must be 0); `reserve_offline_rejected_on_ack_total`.

## Tests
- TEST-PS-035-06-01 (concurrency): 500 concurrent bids and one raise → invariant holds (MET iff qualifying bid exists; raise only before bids).
- TEST-PS-035-06-02 (fault): kill between bid write and MET write → one reconciled MET, no duplicate event.
- TEST-PS-035-06-03 (offline): queued raise after first bid rejected on ack.
- TEST-PS-035-06-04 (idempotency): duplicate set produces one history row.

## Acceptance criteria
1. Invariant test passes across fault suite.
2. Reconciliation metric zero in soak test.
3. No offline edit is applied after a bid.

## Assumptions & open decisions
- ASSUMPTION: 1-minute reconciliation fallback.
- PROVISIONAL: offline writes pending until acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
