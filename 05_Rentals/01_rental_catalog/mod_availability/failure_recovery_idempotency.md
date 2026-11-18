# PS-039-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-06.R01 | Concurrent holds on overlapping dates: exactly one succeeds; others receive `AVAIL.CONFLICT`. Enforced by the exclusion constraint. | MVP |
| PS-039-06.R02 | Hold expiry timer runs every 30 s and releases all TENTATIVE rows past `hold_expires_at`. | MVP |
| PS-039-06.R03 | Owner block made offline is queued on device (D08) with idempotency key and sent on reconnect; server applies it only if no BOOKED or IN_USE overlap, else returns `AVAIL.BOOKED_PROTECTED` and the device shows the conflict. | MVP |
| PS-039-06.R04 | Holds are never created offline. The UI disables Hold when offline. | MVP |
| PS-039-06.R05 | Lifecycle events from mod_handoff and mod_return are deduplicated by `(rental_id, event_type)`. | MVP |

## Data / schema
Adds `applied_request_id` on blocks created from offline queue, for idempotent replay.

## Commands / queries / events
Retries reuse command keys (PS-039-04).

## States & transitions
Recovery uses PS-039-03 transitions only.

## Validation & errors
`AVAIL.CONFLICT`, `AVAIL.BOOKED_PROTECTED` as specified; `AVAIL.STATE_CONFLICT` retryable.

## Authorization
Timer runs as `sys_`. Offline replay uses the owner's session; expired session requires re-login before replay.

## Failure, idempotency, concurrency, offline
Timer failure: next run catches up; no hold survives more than 30 s past expiry in steady state. Network partition during hold: client shows "not confirmed" until server response. Owner offline edits: pending queue purged after 7 days (ASSUMPTION) with user notice.

## Privacy, retention, abuse
Offline queue on device stores dates and block_type only.

## Observability & budgets
Timer lag gauge; offline queue replay success rate.

## Tests
- TEST-PS-039-06-01 (concurrency): 50 concurrent holds on same dates produce one BOOKED or TENTATIVE.
- TEST-PS-039-06-02 (timer): expired hold released within 30 s.
- TEST-PS-039-06-03 (offline): owner block queued offline conflicts with booking and is refused with message.
- TEST-PS-039-06-04 (duplicate): lifecycle event delivered twice applied once.

## Acceptance criteria
1. No double booking under concurrency fixture.
2. Offline holds impossible in client and server.
3. Offline owner blocks never overwrite bookings.

## Assumptions & open decisions
- ASSUMPTION: 7-day offline queue retention.
- PROVISIONAL (D08 default, unapproved): offline owner writes queued until relay acknowledgment.
