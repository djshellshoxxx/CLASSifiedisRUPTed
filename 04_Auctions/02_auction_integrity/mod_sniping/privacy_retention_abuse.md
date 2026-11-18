# PS-038-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-07.R01 | `BidTimingEvent` is PSEUDONYMOUS. Its precise timestamps are treated as behavioral data and are never shown to other bidders. | MVP |
| PS-038-07.R02 | Retention: timing events 180 days after close (PROVISIONAL, D07); aggregates kept 2 years with no bidder_id. | MVP |
| PS-038-07.R03 | Device-side pending queue (PS-038-06) is purged on sign-out and after ack. | MVP |
| PS-038-07.R04 | Timing events are not used as location signals. | MVP |
| PS-038-07.R05 | Timing data is never federated (PROVISIONAL, D01 default). | MVP |

## Data / schema
Class per field: `bidder_id` PSEUDONYMOUS; `client_sent_at` PSEUDONYMOUS (hint); aggregates PUBLIC at k >= 5.

## Commands / queries / events
No event exposes `client_sent_at`.

## States & transitions
Expiry: row deleted at 180 days; aggregate retained.

## Validation & errors
`SNIPE.FIELD_PROHIBITED` if a location or device attribute is submitted. Non-retryable.

## Authorization
Account deletion removes bidder_id from timing rows; aggregates keep counts only (CTR-PRV-001 R12 completion record).

## Failure, idempotency, concurrency, offline
Retention job idempotent by date. Deletion propagates within 24 h.

## Privacy, retention, abuse
Abuse controls: summary queries rate-limited (PS-038-05); no public timing display; bots that always bid in the SNIPE window are visible to F12 via detail read, not to sellers. Pseudonyms do not guarantee anonymity: timing patterns can link accounts.

## Observability & budgets
Retention job completion report with counts only.

## Tests
- TEST-PS-038-07-01 (lint): no event or seller schema contains `client_sent_at`.
- TEST-PS-038-07-02 (retention): row deleted at 180 days; aggregate survives.
- TEST-PS-038-07-03 (deletion): account deletion removes bidder_id; counts unchanged.

## Acceptance criteria
1. Retention periods match the table, PROVISIONAL.
2. No timing detail reaches non-F12 actors.
3. Deletion fixture passes.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): 180-day and 2-year retention.
- PROVISIONAL (D01 default, unapproved): no federation.
