# PS-033-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-06.R01 | Placement runs under the auction lock; the lock wait p99 ≤ 50 ms. | MVP |
| PS-033-06.R02 | Duplicate placement with same key returns original `bid_id` within 24 h. | MVP |
| PS-033-06.R03 | Two bids at the same revision: the first to acquire the lock is ordered first; the second is re-validated against the new high and rejected with `BIDS.AMOUNT_BELOW_INCREMENT` if no longer valid. No silent acceptance. | MVP |
| PS-033-06.R04 | Offline bids are held in the pending queue (D08). On acknowledgement, a bid is rejected if the auction is no longer OPEN or the high has moved; a rejected bid is never applied retroactively. | MVP |
| PS-033-06.R05 | A bid written after the close lock is rejected; ordering uses server sequence. | MVP |

## Data / schema
Idempotency record: (`acc_`, command, key, digest, result `bid_id`). Placement lock keyed by `auc_`.

## Commands / queries / events
Retries reuse key. Each accepted bid emits exactly one `bids.bid.accepted` (transactional outbox).

## States & transitions
No recovery path changes ACCEPTED to any other state except via PS-033-03 transitions.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED`. `SYS.CONFLICT` requires a fresh read and a new attempt with a new key.

## Authorization
Lock and outbox run as system.

## Failure, idempotency, concurrency, offline
- Timeout after commit: client retries with same key, receives same `bid_id`.
- Timeout before commit: retry places the bid once.
- Lock holder crash: lock released by lease expiry (ASSUMPTION 2 s); placement transaction is atomic so no partial bid exists.
- Offline: pending bids show "not yet placed" and never affect the displayed high bid.

## Privacy, retention, abuse
Recovery logs contain IDs and codes. Pending queue entries encrypted at rest on device (ASSUMPTION).

## Observability & budgets
Metrics: `bids_lock_wait_seconds` p99 ≤ 50 ms; `bids_duplicate_replays_total`; `bids_offline_rejected_on_ack_total`; `bids_outbox_lag_seconds` p95 ≤ 2 s.

## Tests
- TEST-PS-033-06-01 (concurrency): 1,000 concurrent bids on one auction → monotonic sequences, no duplicate sequence, highest bid correct.
- TEST-PS-033-06-02 (fault): kill after commit, before response → retry returns same `bid_id`.
- TEST-PS-033-06-03 (offline): queued bid rejected after auction closed on ack; no outbid event emitted.
- TEST-PS-033-06-04 (fault): lock holder crash → lease expires; next bid proceeds.

## Acceptance criteria
1. Zero duplicate sequences in concurrency suite.
2. Zero offline bids applied after close.
3. Lock wait p99 within budget under load test.

## Assumptions & open decisions
- ASSUMPTION: 2 s lock lease.
- PROVISIONAL: offline writes pending until acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
