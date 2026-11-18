# F06.S02.M02 — location

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead. **Parent:** F06.S02.

## Purpose and business behavior
Let a user give discovery a location without giving the platform their precise position. The user either picks a region cell from the registry or, with explicit device permission, resolves the device's position to a cell on the client. Only the cell is stored and sent. Precise coordinates are never persisted, logged or federated in MVP. The module owns this boundary between device or user input and the coarse location the rest of discovery sees.

## User stories
- As a buyer, I choose my area from a list of named regions and can change it at any time.
- As a buyer, I can let my phone pick my region once, and the platform only learns the region.
- As a user, I can withdraw device-location consent and my device-sourced region is cleared within 60 s.
- As a privacy reviewer, I can confirm that no coordinates appear in any stored record, log or request.

## Scope
Cell picker, device-resolution consent, client-side cell resolution against registry geometry, stored cell lifecycle, withdrawal and deletion. Not in scope: cell registry (F06.S02.M01 coarse), proximity queries (M03 proximity), home-address geocoding (Future, F10 review).

- [domain_schema.md](domain_schema.md) — PS-048-01
- [validation_rules.md](validation_rules.md) — PS-048-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-048-03
- [commands_queries_events.md](commands_queries_events.md) — PS-048-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-048-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-048-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-048-07
- [observability_performance.md](observability_performance.md) — PS-048-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-048-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-048-10

## Public interfaces
Commands `location.cell.set`, `location.cell.clear`, `location.consent.grant`, `location.consent.withdraw`; query `location.cell.get`; event `location.cell.changed`. Error prefix `LOCATION.`.

## Relationships, dependencies and integration
Upstream: F06.S02.M01 coarse (active registry geometry and version), F07 accounts and sessions, F16 capabilities, F10 disclosure rules. Downstream: mod_query (scope), mod_proximity (cell adjacency), mod_relevance (cell match), notifications are not triggered by location changes. Meetup disclosure of precise location belongs to messaging and handoff modules, not here.

## Data ownership
Owns the stored cell and device-consent records for discovery. Precise coordinates are owned by no module in MVP because they are not stored. Account deletion clears the cell.

## Risk considerations
Precise location leakage through requests, logs, analytics SDKs or URLs; stalking through location-change timing; GPS spoofing that moves users into other cells; trilateration by repeated cell changes; third-party geocoders receiving addresses (not in MVP). No platform custody of money involved. Pseudonymity does not hide a region from someone who can see the region.

## Completion criteria
Process specs at SPEC-DRAFT-COMPLETE; F10 review of client-side resolution (D05 PROVISIONAL); F16 guest decision; test IDs mapped.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-048-01, SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-048-02, SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-048-03, SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-048-04, SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-048-05, SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-048-06, SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-048-07, SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-048-08, SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-048-09, SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-048-10, SPEC-DRAFT-COMPLETE
