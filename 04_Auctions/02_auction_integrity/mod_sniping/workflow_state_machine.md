# PS-038-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-03.R01 | Timing record states: RECEIVED, CLASSIFIED, ACCEPTED_IN_ORDER, REJECTED_AFTER_CLOSE. No other states. | MVP |
| PS-038-03.R02 | Clock states: OK and DEGRADED. DEGRADED is entered when measured skew > 500 ms (ASSUMPTION) for 3 consecutive checks. | MVP |
| PS-038-03.R03 | Records are never moved back from a terminal state. | MVP |
| PS-038-03.R04 | Each transition appends one `sniping.*` event. | MVP |

## Data / schema
`BidTimingEvent.class` and `acceptance` per PS-038-01. Clock state stored in the clock-health stream, not per bid.

## Commands / queries / events
Transitions are triggered by `sniping.timing.record` (PS-038-04) and clock-health checks.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| (none) | bid.received | bid_id not seen | RECEIVED | assign server_received_at |
| RECEIVED | classify | clock_status OK | CLASSIFIED | set class NORMAL, LATE or SNIPE |
| RECEIVED | classify | clock_status DEGRADED | CLASSIFIED | set class UNCLASSIFIED |
| CLASSIFIED | order.commit | seconds_before_close > 0 | ACCEPTED_IN_ORDER | emit sniping.bid_classified |
| CLASSIFIED | order.commit | seconds_before_close <= 0 | REJECTED_AFTER_CLOSE | emit sniping.bid_rejected_after_close |
| OK | skew checks x3 > 500 ms | — | DEGRADED | emit sniping.clock_degraded |
| DEGRADED | skew checks x3 <= 500 ms | — | OK | emit sniping.clock_restored |

## Validation & errors
Invalid transitions: `SNIPE.STATE_CONFLICT` (internal; alert).

## Authorization
Transitions run as `sys`. Read rules in PS-038-05.

## Failure, idempotency, concurrency, offline
Classification is recomputed from `server_received_at` on retry, so it is idempotent. Offline bids remain RECEIVED until server acknowledgment; they are never classified from device time.

## Privacy, retention, abuse
Events carry `timing_id` and class only; no `bidder_id` in clock events.

## Observability & budgets
Gauge of time in DEGRADED. Classification p95 <= 50 ms.

## Tests
- TEST-PS-038-03-01 (unit): each row executes once with stated side effect.
- TEST-PS-038-03-02 (fault): three skew samples above 500 ms enter DEGRADED; three below restore OK.
- TEST-PS-038-03-03 (offline): bid queued offline for 90 s before ack is classified by server time at ack.

## Acceptance criteria
1. No transition outside the table.
2. DEGRADED never produces SNIPE or LATE.
3. Offline fixture classifies from server time only.

## Assumptions & open decisions
- ASSUMPTION: 500 ms skew threshold and three-sample hysteresis.
- PROVISIONAL (D08 default, unapproved): offline bids wait for relay acknowledgment before classification.
