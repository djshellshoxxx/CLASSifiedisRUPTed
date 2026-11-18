# PS-039-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-07.R01 | Public calendar reveals FREE or BUSY only. Booking reason and renter identity are never public. | MVP |
| PS-039-07.R02 | `item_timezone` is LOCATION_COARSE. Precise pickup address is never stored in this module (CTR-PRV-001 R03). | MVP |
| PS-039-07.R03 | Retention: BOOKED, IN_USE and RELEASED history 2 years (ASSUMPTION, dispute support); expired TENTATIVE rows 30 days; owner blocks 2 years. PROVISIONAL (D07). | MVP |
| PS-039-07.R04 | Holds per renter: maximum 3 active; maximum 5 hold creations per item per renter per 24 h. | MVP |
| PS-039-07.R05 | Availability history is not federated (D01 default). | MVP |

## Data / schema
Classes: `rental_id` PSEUDONYMOUS; `item_timezone` LOCATION_COARSE; dates PUBLIC for FREE/BUSY.

## Commands / queries / events
Events exclude renter identity.

## States & transitions
Expiry deletes TENTATIVE rows; RELEASED rows archived after 2 years.

## Validation & errors
`AVAIL.HOLD_LIMIT` (429) when renter exceeds PR04 limits.

## Authorization
Account deletion nulls `rental_id` owner reference on history and keeps date ranges.

## Failure, idempotency, concurrency, offline
Retention job idempotent by date.

## Privacy, retention, abuse
Hold-squatting: 15-minute expiry and per-renter cap. Scraping: anonymous reads rate-limited. Inference: BUSY ranges could reveal bookings; accepted residual risk, documented. Pseudonyms do not guarantee anonymity.

## Observability & budgets
Count holds per renter bucket; alert on hold-squatting pattern (many holds, few confirms).

## Tests
- TEST-PS-039-07-01 (lint): public schema excludes rental_id and reason.
- TEST-PS-039-07-02 (abuse): fourth active hold rejected with AVAIL.HOLD_LIMIT.
- TEST-PS-039-07-03 (retention): expired TENTATIVE deleted at 30 days.
- TEST-PS-039-07-04 (deletion): account deletion keeps date ranges, nulls owner reference.

## Acceptance criteria
1. No public response contains renter identity.
2. Hold caps enforced.
3. Retention schedule matches table.

## Assumptions & open decisions
- ASSUMPTION: accepted residual risk that BUSY ranges reveal bookings.
- PROVISIONAL (D07 default, unapproved): retention periods above.
- PROVISIONAL (D05 default, unapproved): coarse timezone only.
