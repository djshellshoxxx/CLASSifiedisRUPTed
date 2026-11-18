# PS-034-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-06.R01 | Exactly one close record per `auc_` (unique constraint); concurrent close jobs yield one record. | MVP |
| PS-034-06.R02 | Close job restarts deterministically from the last committed step; re-running produces the same `close_hash`. | MVP |
| PS-034-06.R03 | `CONFIRMED` and `trx_` creation are atomic (outbox). A crash between them leaves `ENDED_SOLD` and is repaired by reconciliation within 5 min. | MVP |
| PS-034-06.R04 | Missed close timer is caught by a sweeper every 60 s; close latency after effective end p95 ≤ 5 s. | MVP |
| PS-034-06.R05 | No automatic reversal of a close. Corrections use `auction.close_reversed` with case scope and dual control; they never edit the close record. | MVP |

## Data / schema
Close job checkpoint: (`auc_`, step, `final_revision`, attempted_at). Idempotency per (`auc_`, `final_revision`).

## Commands / queries / events
Retries reuse key. `auction.closed` emitted once per record via outbox.

## States & transitions
No transition returns CONFIRMED to ENDED_SOLD. Reversal is a separate event recorded in the audit log (Future-compatible), not a state change in MVP.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `CLOSE.BEFORE_END` (clock skew). Non-retryable: `CLOSE.ALREADY_CLOSED`, `CLOSE.INVALID_TRANSITION`.

## Authorization
Close and sweeper run as `sys`.

## Failure, idempotency, concurrency, offline
- Crash mid-close: restart from checkpoint; close record write is atomic.
- F09 unavailable at confirm: `SYS.UNAVAILABLE`; retry with same key.
- Bids arriving after CLOSING: rejected (PS-033-06 R05); never change `final_revision`.
- Offline: sellers and bidders see close state as read-only; offline confirmation is queued (D08) and rejected if UNCONFIRMED by ack.

## Privacy, retention, abuse
Checkpoint rows hold IDs and step enum only.

## Observability & budgets
Metrics: `close_runs_total{end_state}`, `close_lag_seconds` p95 ≤ 5 s, `close_reconciliation_repairs_total`, `close_duplicate_records_total` (must be 0).

## Tests
- TEST-PS-034-06-01 (concurrency): 10 parallel close jobs → one record.
- TEST-PS-034-06-02 (fault): kill after record write, before outbox → reconciliation emits event once.
- TEST-PS-034-06-03 (fault): kill after `trx_` insert, before commit → no `trx_` row; retry creates one.
- TEST-PS-034-06-04 (timer): sweeper restart after missed close → closes within 60 s.

## Acceptance criteria
1. Duplicate close records = 0 across fault suite.
2. Reconciliation repairs within 5 min in all fault cases.
3. No code path modifies a written close record.

## Assumptions & open decisions
- ASSUMPTION: 60 s sweeper; 5 min reconciliation.
- PROVISIONAL: D04 partial execution (unapproved); D08 offline queue (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
