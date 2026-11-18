# F06.S02.M01 — coarse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead. **Parent:** F06.S02.

## Purpose and business behavior
Own the registered region-cell set used for every coarse location in discovery, and decide which cells may be shown. A cell is published only when it holds at least K_MIN = 5 active items; sparser cells merge upward or are suppressed. This keeps "in your area" results from exposing individual listings or households.

## User stories
- As a buyer, I browse by named regions (cells), not by coordinates.
- As a seller, I can see that my area is shown, and I am not shown a sparse cell that would expose me.
- As a privacy reviewer, I can confirm that no cell or count below K_MIN leaves the system.
- As an operator, I can propose, approve and retire cells with two-person control.

## Scope
Cell registry, parent hierarchy, publication thresholds, merge and suppression, registry versioning. Not in scope: converting a user's location to a cell (F06.S02.M02 location), proximity queries (M03 proximity), index contents (F06.S01.M01 index).

- [domain_schema.md](domain_schema.md) — PS-047-01
- [validation_rules.md](validation_rules.md) — PS-047-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-047-03
- [commands_queries_events.md](commands_queries_events.md) — PS-047-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-047-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-047-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-047-07
- [observability_performance.md](observability_performance.md) — PS-047-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-047-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-047-10

## Public interfaces
Commands `cell.propose`, `cell.approve`, `cell.retire`, `publication.recompute`; query `geo.cells.list`; event `geo.cell.published_state_changed`. Error prefix `COARSE.`.

## Relationships, dependencies and integration
Upstream: F10 (K_MIN, disclosure rules, cell approval), F06.S01.M01 index (active counts), F16 (capabilities). Downstream: mod_location (cell assignment), mod_proximity (adjacency), mod_query (scope validation), mod_index (cell field). Federation of cells follows CTR-PRV-001 K_MIN rule.

## Data ownership
Owns the cell registry, its versions and publication flags. Does not own item counts (index) or user locations (location module).

## Risk considerations
Differencing attacks on publication flags; sparse cells that identify a single seller; mis-drawn cell boundaries that place a home in the wrong cell; stale registry after retirement; unauthorized cell proposals. No platform custody of money involved. Cell-level location is not anonymity: small regions remain identifying.

## Completion criteria
Process specs at SPEC-DRAFT-COMPLETE; F10 validates K_MIN and cell format; PENDING CTR-DSC-001 resolved; test IDs mapped.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-047-01, SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-047-02, SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-047-03, SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-047-04, SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-047-05, SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-047-06, SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-047-07, SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-047-08, SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-047-09, SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-047-10, SPEC-DRAFT-COMPLETE
