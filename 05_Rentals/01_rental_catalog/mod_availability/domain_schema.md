# PS-039-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-01.R01 | Canonical record class for rental date availability is `AvailabilityBlock`, owned here. Prefix `avb_` is ASSUMPTION until registered in CTR-ID-001. | MVP |
| PS-039-01.R02 | Blocks are half-open date intervals `[start_date, end_date)` in the item's local calendar. A block of one day is start+1. | MVP |
| PS-039-01.R03 | No two unreleased blocks for the same item overlap. Enforced by a database exclusion constraint, not only in application code. | MVP |
| PS-039-01.R04 | Maximum block length 365 days (ASSUMPTION). | MVP |
| PS-039-01.R05 | Stock quantity (01_LocalBazaar/03_inventory/mod_availability) and provider time slots (03_Services/01_service_catalog/mod_availability) are different record classes and are not stored here. | MVP |

## Data / schema
```
AvailabilityBlock {
  block_id: "avb_<ulid>"                 REQUIRED
  item_id: "lst_..."                     REQUIRED, FK rental listing (01_listings)
  start_date: DATE (ISO 8601)            REQUIRED
  end_date: DATE (exclusive)             REQUIRED, > start_date, span <= 365 days
  block_type: enum[TENTATIVE, BOOKED, IN_USE, OWNER_BLOCK, MAINTENANCE]
  rental_id: "rnt_..." | null            required for TENTATIVE, BOOKED, IN_USE
  hold_expires_at: RFC3339 UTC | null    required for TENTATIVE only
  item_timezone: IANA zone string        LOCATION_COARSE class
  released_at: RFC3339 UTC | null
  version: int >= 1                      optimistic lock
  schema_version: int >= 1
}
```
Constraint: `EXCLUDE USING gist (item_id WITH =, daterange(start_date, end_date, '[)') WITH &&) WHERE (released_at IS NULL)`.

## Commands / queries / events
Defined in PS-039-04. Schema change follows CTR-SCH-001.

## States & transitions
Block lifecycle in PS-039-03.

## Validation & errors
Bounds and overlap rules in PS-039-02.

## Authorization
`rental_id` visible to item owner and the renter only; hidden from all other callers (PS-039-05).

## Failure, idempotency, concurrency, offline
Exclusion constraint is the final arbiter under concurrent holds. Version check on owner edits.

## Privacy, retention, abuse
`rental_id` is PSEUDONYMOUS; `item_timezone` is LOCATION_COARSE per CTR-PRV-001 R04. Retention in PS-039-07.

## Observability & budgets
Row count per item monitored. Insert p95 <= 15 ms.

## Tests
- TEST-PS-039-01-01 (constraint): overlapping unreleased blocks rejected by the database.
- TEST-PS-039-01-02 (boundary): block ending on day D and block starting on day D both succeed.
- TEST-PS-039-01-03 (lint): `rental_id` absent from public response schema.

## Acceptance criteria
1. Overlap guarantee holds in database under concurrent insert fixture.
2. Half-open semantics tested at boundaries.
3. Class separation from other mod_availability slugs documented and linked.

## Assumptions & open decisions
- ASSUMPTION: `avb_` registered in CTR-ID-001.
- ASSUMPTION: 365-day maximum block span.
- PROVISIONAL (D05 default, unapproved): timezone exposed only at coarse level.
