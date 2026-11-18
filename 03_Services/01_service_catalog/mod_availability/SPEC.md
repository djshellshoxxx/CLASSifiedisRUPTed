# F03.S01.M02 — availability

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F03). **Parent:** F03.S01.

## Purpose and business behavior
Holds a provider's bookable time windows for a service listing (`srv_`), expressed in the provider's IANA timezone with an optional recurrence rule. Windows move between OPEN, HELD, BOOKED and BLOCKED under quote events from `mod_quotes`. Holds expire after 72 hours. This module does not store listing stock quantities (those stay in F01.S03.M01) and does not store precise service locations.

## User stories
- As a provider, I publish weekly bookable windows and block a day without revealing my routine to strangers.
- As a customer, I see open start times for a service and get a hold that a quote can convert to a booking.
- As a provider, I import my existing calendar as ICS and see rejected entries listed by position, not by content.

## Scope
- Owns: service availability windows (`avw_`, pending prefix registration), hold and booking-link state, ICS import and export.
- Consumes: quote events from F03.S02.M01 `mod_quotes`; service listings from F03.S01 (`srv_`); offline pending writes from F15.S01.M01.
- Out of scope: listing stock quantities (F01.S03.M01), quote pricing (F03.S02.M01), skill matching (F03.S01.M01).

## Public interfaces
Commands `svcavail.create_window`, `svcavail.update_window`, `svcavail.hold`, `svcavail.block`, `svcavail.unblock`, `svcavail.retire`, `svcavail.import_ics`; query `svcavail.search_slots`; events `svcavail.window.*`, `svcavail.hold.expired`, `svcavail.booking.*`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F01.S03.M01 (listing availability, separate record class), F03.S01.M01 `mod_skills`, F15.S01.M01 `mod_offline`. Downstream: F03.S02.M01 `mod_quotes`. Contracts: CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001.

## Data ownership
Canonical owner of service-availability windows: F03.S01.M02 (this module), keyed by `avw_` (prefix PENDING CTR-ID-001). Canonical owner of listing stock quantity: F01.S03.M01. Both modules carry the slug `mod_availability`; consumers reference the full IDs only (review B-06). Quote and booking records are owned by F03.S02.M01 and F09.

## Risk considerations
- Schedule leakage revealing a provider's routine or home presence.
- Double booking under concurrent holds.
- Timezone and DST errors producing wrong start times.
- Stale availability after offline edits.
- Calendar blocking abuse through fake holds.
- Enumeration of provider windows by unauthenticated users.

## Completion criteria
All ten process specs (PS-028-01 to PS-028-10) are SPEC-DRAFT-COMPLETE; `avw` prefix registration is requested; B-06 owner note is recorded in CONTRACTS.md; implementation and tests are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-028-01
- [x] [validation_rules.md](validation_rules.md) — PS-028-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-028-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-028-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-028-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-028-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-028-07
- [x] [observability_performance.md](observability_performance.md) — PS-028-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-028-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-028-10
