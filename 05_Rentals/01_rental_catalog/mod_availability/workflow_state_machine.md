# PS-039-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-03.R01 | Block states: TENTATIVE, BOOKED, IN_USE, OWNER_BLOCK, MAINTENANCE, RELEASED. RELEASED is terminal. | MVP |
| PS-039-03.R02 | TENTATIVE holds expire 15 min after creation (ASSUMPTION) and release automatically. | MVP |
| PS-039-03.R03 | BOOKED moves to IN_USE only on a handoff event from 05_Rentals/02_rental_lifecycle/mod_handoff, and IN_USE moves to RELEASED only on a return event from mod_return. | MVP |
| PS-039-03.R04 | A BOOKED block is released by renter cancellation only before handoff. After handoff, cancellation is handled by the rental lifecycle, not here. | MVP |
| PS-039-03.R05 | Every transition emits one `availability.*` event and increments `version`. | MVP |

## Data / schema
`block_type` and `released_at` per PS-039-01.

## Commands / queries / events
Transitions driven by commands in PS-039-04 and by lifecycle events from mod_handoff and mod_return.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| (none) | hold | no overlap; renter holds < 3 active | TENTATIVE | set hold_expires_at; emit availability.hold_created |
| TENTATIVE | confirm (sys) | rental payment-free confirmation recorded in rental lifecycle; not expired | BOOKED | emit availability.booked |
| TENTATIVE | timer 15 min | still TENTATIVE | RELEASED | emit availability.hold_expired |
| TENTATIVE | renter cancel | owner of hold | RELEASED | emit availability.released |
| BOOKED | renter cancel | before handoff | RELEASED | emit availability.released |
| BOOKED | handoff event (mod_handoff) | rental_id matches | IN_USE | emit availability.in_use |
| IN_USE | return event (mod_return) | rental_id matches | RELEASED | emit availability.released |
| (none) | block (owner) | no overlap with BOOKED or IN_USE | OWNER_BLOCK or MAINTENANCE | emit availability.blocked |
| OWNER_BLOCK or MAINTENANCE | unblock (owner) | not overlapped by booking | RELEASED | emit availability.unblocked |

## Validation & errors
Invalid transition returns `AVAIL.STATE_CONFLICT` (retryable after re-read).

## Authorization
Guards per PS-039-05. Timer and lifecycle transitions run as `sys`.

## Failure, idempotency, concurrency, offline
Each transition uses compare-and-set on `version`. Timer is idempotent. Lifecycle events are deduplicated by `rental_id` + event type.

## Privacy, retention, abuse
Events carry `block_id`, `item_id`, `block_type` only; `rental_id` is in the event envelope for the owner and renter views.

## Observability & budgets
Gauge of TENTATIVE count; hold-expiry lag p95 <= 30 s.

## Tests
- TEST-PS-039-03-01 (unit): each row executes once with stated side effect.
- TEST-PS-039-03-02 (timer): hold created at T is RELEASED at T+15 min with no renter action.
- TEST-PS-039-03-03 (lifecycle): handoff event moves BOOKED to IN_USE; return event releases.

## Acceptance criteria
1. No transition outside the table.
2. Hold expiry within 30 s of 15 min.
3. Lifecycle integration fixtures pass with mod_handoff and mod_return stubs.

## Assumptions & open decisions
- ASSUMPTION: 15 min hold duration; 3 active holds per renter.
- PROVISIONAL (D08 default, unapproved): holds are online-only; no offline hold creation.
