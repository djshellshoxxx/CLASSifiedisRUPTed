# PS-038-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-01.R01 | Persist one immutable `BidTimingEvent` per accepted or rejected bid. Prefix `btm_` is ASSUMPTION until registered in CTR-ID-001. | MVP |
| PS-038-01.R02 | `server_received_at` is the only time used for ordering and classification. Client timestamps are stored as hints only. | MVP |
| PS-038-01.R03 | Close time is read from the auction's `close_at` owned by 01_auction_lifecycle/mod_close; this module never stores a second authoritative close time. | MVP |
| PS-038-01.R04 | Classification thresholds (PROVISIONAL): SNIPE when 0 < seconds_before_close <= 10; LATE when 10 < s <= 120; NORMAL otherwise. | MVP |
| PS-038-01.R05 | Per-auction timing aggregates are derived, not stored as truth; they are recomputable from events. | MVP |

## Data / schema
```
BidTimingEvent {
  timing_id: "btm_<ulid>"                REQUIRED
  auction_id: "auc_..."                  REQUIRED
  bid_id: "bid_..."                      REQUIRED, unique per auction
  bidder_id: "acc_..."                   REQUIRED (PSEUDONYMOUS)
  server_received_at: RFC3339 UTC, ms    REQUIRED
  close_at_snapshot: RFC3339 UTC, ms     REQUIRED
  seconds_before_close: int              REQUIRED (negative = after close)
  class: enum[NORMAL, LATE, SNIPE, UNCLASSIFIED]
  clock_status: enum[OK, DEGRADED]
  acceptance: enum[ACCEPTED, REJECTED_AFTER_CLOSE]
  client_sent_at: RFC3339 | null         hint only, never ordering
  source_event_id: "evt_..."             REQUIRED
  schema_version: int >= 1
}
```
Constraint: unique(auction_id, bid_id). No update path; corrections are new events.

## Commands / queries / events
Defined in PS-038-04. Schema changes via CTR-SCH-001.

## States & transitions
Defined in PS-038-03.

## Validation & errors
Defined in PS-038-02.

## Authorization
`client_sent_at` is visible to the bidder only; never to sellers or other bidders.

## Failure, idempotency, concurrency, offline
Insert is idempotent on `(auction_id, bid_id)`. Offline bids get `server_received_at` at server acknowledgment (PS-038-06).

## Privacy, retention, abuse
`bidder_id` with precise timestamps is PSEUDONYMOUS but behavior-revealing; retention in PS-038-07.

## Observability & budgets
Insert p95 <= 10 ms. Row count per auction reported, not row content.

## Tests
- TEST-PS-038-01-01 (constraint): duplicate `(auction_id, bid_id)` rejected.
- TEST-PS-038-01-02 (lint): `client_sent_at` absent from any seller-facing schema.
- TEST-PS-038-01-03 (recompute): aggregates rebuilt from events equal live aggregates.

## Acceptance criteria
1. Every field has type, bounds, class and provenance.
2. No stored second close time exists.
3. Events are append-only.

## Assumptions & open decisions
- ASSUMPTION: `btm_` prefix registered in CTR-ID-001.
- PROVISIONAL (no Dxx): thresholds 10 s and 120 s, for F04 product confirmation.
- PROVISIONAL (D07 default, unapproved): retention per PS-038-07.
