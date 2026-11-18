# F05.S01.M01 — availability

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead. **Parent:** F05.S01.

## Purpose and business behavior
Own the date-range availability of each rental item: which dates are free, held by a renter, booked, in use, or blocked by the owner for maintenance or personal use. Holds expire after 15 minutes so an unpaid or abandoned request cannot lock dates. This module is the canonical owner of the rental availability record class (`AvailabilityBlock`, B-06). Consumers reference it by the full ID `05_Rentals/01_rental_catalog/mod_availability`. The `mod_availability` slugs in 01_LocalBazaar/03_inventory (stock quantity) and 03_Services/01_service_catalog (provider time slots) are different record classes and are not reused.

## User stories
- As a renter, I see which dates are free for an item, and I can hold them for a short time while I confirm.
- As an owner, I block dates for maintenance or personal use, and the block cannot overwrite a booking.
- As an anonymous visitor, I see free and busy dates without seeing who booked them.

## Scope
- Date-range blocks per rental item, half-open intervals, 365-day maximum span.
- Holds, confirmation, owner blocks, release, lifecycle links to handoff and return.
- Out of scope: deposits (mod_deposits), rental catalog listing (01_listings), handoff and return records (05_Rentals/02_rental_lifecycle), payments (F09, no platform custody per D09).

## Public interfaces
Commands `rental.availability.hold | confirm | block | unblock | release`; query `availability.read`; events `availability.*`; errors `AVAIL.*`; capabilities `rental.hold`, `rental.block`, `rental.confirm`, `rental.release`, `availability.read`. Details in PS-039-04 and PS-039-05.

## Relationships, dependencies and integration
Upstream: 01_listings (item ownership), 05_Rentals/02_rental_lifecycle/mod_handoff and mod_return (state transitions), F07 accounts, F16 capabilities, F15 events. Downstream: renter and owner calendar UI, mod_deposits (booking window reference). Offline behavior follows D08.

## Data ownership
Owns AvailabilityBlock rows and their history. Does not own listings, rental records (`rnt_`), or renter identity.

## Risk considerations
Double booking under concurrent holds (mitigated by database exclusion constraint). Hold-squatting that blocks competing renters (15-minute expiry and per-renter caps). Owner offline edits overwriting bookings (server rule wins). Timezone errors around midnight for items in other zones. BUSY ranges can reveal that a booking exists; accepted residual risk. Pseudonyms do not guarantee anonymity.

## Completion criteria
PS-039-01 to PS-039-10 SPEC-DRAFT-COMPLETE; exclusion constraint and concurrency fixtures specified; class-separation note linked from the other two `mod_availability` modules (lead); privacy review scheduled (not claimed as done).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-039-01
- [x] [validation_rules.md](validation_rules.md) — PS-039-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-039-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-039-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-039-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-039-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-039-07
- [x] [observability_performance.md](observability_performance.md) — PS-039-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-039-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-039-10
