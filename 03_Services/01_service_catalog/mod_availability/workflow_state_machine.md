# PS-028-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-03.R01 | Window states: `OPEN`, `HELD`, `BOOKED`, `BLOCKED`, `RETIRED`. No other state exists. | MVP |
| PS-028-03.R02 | A hold has TTL 72 hours (ASSUMPTION) and is released by quote decline, expiry or withdrawal (`svq` events from F03.S02.M01). | MVP |
| PS-028-03.R03 | `BOOKED` is set only by an accepted quote and is terminal for that window except by provider-initiated cancellation with a `svcavail.booking_released` event. | MVP |
| PS-028-03.R04 | A window with status `BOOKED` cannot be `RETIRED` or edited in time range. | MVP |

## Data / schema
`status` and `hold_expires_at` on the window row. Hold holder recorded as `svq_` ID (no customer ID on the window).

## Commands / queries / events
Transitions triggered by PS-028-04 commands and by quote events (`svcquote.sent`, `svcquote.accepted`, `svcquote.declined`, `svcquote.expired`, `svcquote.withdrawn`).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| OPEN | svcavail.hold | Capacity remaining; no overlap if capacity 1 | HELD | `hold_expires_at` = now + 72 h |
| HELD | svcquote.declined / withdrawn / expired | Holder matches | OPEN | Release capacity |
| HELD | svcquote.accepted | Holder matches; hold not expired | BOOKED | Create booking link |
| HELD | timer (hold_expires_at) | now ≥ expiry | OPEN | Event `svcavail.hold_expired` |
| OPEN | svcavail.block | Provider | BLOCKED | Event |
| BLOCKED | svcavail.unblock | Provider | OPEN | Event |
| OPEN, BLOCKED | svcavail.retire | Provider; no BOOKED | RETIRED | Event; hidden from search |
| BOOKED | svcavail.booking_released | Provider with cancellation reason | OPEN | Event; notify customer |

Forbidden transitions return `SVCAVAIL.INVALID_TRANSITION` (409, not retryable).

## Validation & errors
`SVCAVAIL.INVALID_TRANSITION` (conflict) with from-state enum as diagnostic.

## Authorization
Provider actions: `srv.update` (self). Quote events handled as `sys` principal scoped to the window.

## Failure, idempotency, concurrency, offline
Hold timer runs every 60 s; expiry idempotent per (window, hold holder). Duplicate quote events deduplicated by `event_id`. Two holds racing for capacity 1: second receives `SVCAVAIL.OVERLAP`-class conflict (`SYS.CONFLICT` retryable false).

## Privacy, retention, abuse
Hold events do not reveal customer identity to other customers. Holds are capped per customer per service (PS-028-07).

## Observability & budgets
Metrics: `svcavail_holds_active`, `svcavail_hold_expired_total`, `svcavail_double_booking_attempts_total` (rejected attempts; booked duplicates must be 0). Hold-expiry lag p95 ≤ 90 s.

## Tests
- TEST-PS-028-03-01 (unit): every row in the table; other pairs rejected.
- TEST-PS-028-03-02 (integration): hold expires after 72 h with no quote action.
- TEST-PS-028-03-03 (concurrency): 100 parallel holds on capacity-1 window → exactly 1 HELD.
- TEST-PS-028-03-04 (integration): duplicate `svcquote.accepted` event produces one booking link.

## Acceptance criteria
1. Booked duplicates = 0 across concurrency suite.
2. Released capacity visible in search within 90 s.
3. State table complete; no state named PAID or CONFIRMED-PAID.

## Assumptions & open decisions
- ASSUMPTION: 72-hour hold TTL.
- Hold ownership interacts with F03.S02.M01 mod_quotes (see that spec). See [DECISIONS.md](../../../DECISIONS.md) D08 (offline pending writes, PROVISIONAL).
