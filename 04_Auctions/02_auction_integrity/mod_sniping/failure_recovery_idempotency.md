# PS-038-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-06.R01 | If the classifier fails, the bid stays RECEIVED and is retried every 2 s for up to 60 s, then flagged for reconciliation. | MVP |
| PS-038-06.R02 | Reconciler reclassifies RECEIVED records older than 60 s every 5 min. | MVP |
| PS-038-06.R03 | Offline bids: the client holds `bid_id` in its local pending queue (D08) until server ack. Client never sends a time that affects class. | MVP |
| PS-038-06.R04 | Bids that race the close: the close snapshot used is the one stored at receipt; later close changes by mod_close do not reclassify. | MVP |
| PS-038-06.R05 | Time source failure (NTP loss) sets clock DEGRADED per PS-038-03 within 10 s. | MVP |

## Data / schema
Adds `reconcile_attempts` int to the internal queue record, not to BidTimingEvent.

## Commands / queries / events
Retries reuse `bid_id` as key.

## States & transitions
Recovery moves RECEIVED back to CLASSIFIED or to UNCLASSIFIED only (PS-038-03).

## Validation & errors
`SNIPE.CLASSIFY_PENDING` (retryable, internal). `SNIPE.CLOCK_DEGRADED` surfaces as status.

## Authorization
Reconciler runs as `sys`.

## Failure, idempotency, concurrency, offline
Duplicate delivery of the same bid: one timing event. Concurrent close-time change: snapshot rule R04 prevents divergence. Offline: queue survives app restart; ack is required before the UI shows "received". Bids with no ack after 24 h are dropped by the client and shown as "not sent".

## Privacy, retention, abuse
Queue on device stores bid IDs only. Stale-queue cleanup on logout.

## Observability & budgets
Reconciler backlog gauge; RECEIVED older than 60 s must be 0 in steady state.

## Tests
- TEST-PS-038-06-01 (fault): classifier outage for 30 s recovers without duplicates.
- TEST-PS-038-06-02 (offline): queued bid acknowledged after 10 min is classified by server time.
- TEST-PS-038-06-03 (race): bid arriving 1 ms before close is ACCEPTED_IN_ORDER; 1 ms after is REJECTED_AFTER_CLOSE.
- TEST-PS-038-06-04 (clock): NTP loss flips DEGRADED within 10 s.

## Acceptance criteria
1. No bid lost or double-counted under the fault fixtures.
2. Offline classification uses server time only.
3. Close snapshot is immutable per record.

## Assumptions & open decisions
- ASSUMPTION: 60 s classifier retry window; 24 h offline ack window.
- PROVISIONAL (D08 default, unapproved): local pending queue until relay acknowledgment.
