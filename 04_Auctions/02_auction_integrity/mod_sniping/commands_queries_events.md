# PS-038-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-04.R01 | `sniping.timing.record` is idempotent on `bid_id`; repeat returns the existing `timing_id`. | MVP |
| PS-038-04.R02 | Events carry `timing_id`, `auction_id`, `class`, `acceptance` only. No `bidder_id` in events. | MVP |
| PS-038-04.R03 | `sniping.auction.timing_summary` returns counts by class; returns no breakdown when the auction has fewer than 5 bids. | MVP |
| PS-038-04.R04 | Recording responds within 100 ms p95; classification may complete asynchronously within 1 s. | MVP |

## Data / schema
- `sniping.timing.record { auction_id, bid_id, client_sent_at? }` key `bid_id`. Server fields are never accepted from the client.
- `sniping.auction.timing_summary { auction_id }` returns `{ total, normal, late, snipe, unclassified }` or `{ suppressed: true }` when total < 5.
- Schema version 1.

## Commands / queries / events
| Name | Type | Event | Idempotent |
|---|---|---|---|
| sniping.timing.record | command (sys, from bid path) | sniping.bid_classified | yes |
| sniping.bid_rejected_after_close | event only | — | n/a |
| sniping.clock_degraded / clock_restored | event | — | yes |
| sniping.auction.timing_summary | query | — | n/a |

## States & transitions
Commands drive the PS-038-03 table only.

## Validation & errors
PS-038-02 codes in CTR-ERR-001 envelope.

## Authorization
See PS-038-05. Summary query is available to the auction seller and F12.

## Failure, idempotency, concurrency, offline
Duplicate `bid_id` returns the original result. Events are published after the state commit (outbox pattern, ASSUMPTION).

## Privacy, retention, abuse
Summary suppression at k < 5 prevents single-bidder inference. Event `max_data_class` = PSEUDONYMOUS.

## Observability & budgets
Latency histogram per command; event lag p95 <= 2 s.

## Tests
- TEST-PS-038-04-01 (contract): events validate against CTR-EVT-001 envelope.
- TEST-PS-038-04-02 (negative): event fixture containing `bidder_id` fails lint.
- TEST-PS-038-04-03 (privacy): summary with 4 bids returns suppressed=true.

## Acceptance criteria
1. Every command has key, capability and error list.
2. No event includes a bidder identifier.
3. Summary suppression verified at k=4 and k=5.

## Assumptions & open decisions
- ASSUMPTION: outbox pattern for event publication.
- PROVISIONAL (no Dxx): k=5 suppression threshold, matching fraud aggregates.
