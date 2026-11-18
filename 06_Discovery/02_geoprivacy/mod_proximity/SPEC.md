# F06.S02.M03 — proximity

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01/F02/F06 accountable; F10 Privacy Lead approves cell and threshold rules). **Parent:** F06.S02.

## Purpose and business behavior
Answer "what is near this coarse area" using registered region cells only. A query names a registered cell and a ring size (0 to 2). The module returns cell-level count buckets, never exact counts below the publication threshold (K_MIN = 5, ASSUMPTION), never precise coordinates, and never a record of who asked where. Proximity is a view over cells, not a distance calculation over people (D05, PROVISIONAL, unapproved).

## User stories
- As a seeker, I see roughly how many items are in my area and the next two areas, without giving my address.
- As a seeker, I can see when a count is hidden because it is too small to publish.
- As an operator, I can change the cell set only with a second approver, and I see budget and narrowing alerts without seeing individuals.

## Scope
- PS-045-01 domain_schema.md
- PS-045-02 validation_rules.md
- PS-045-03 workflow_state_machine.md
- PS-045-04 commands_queries_events.md
- PS-045-05 authorization_capabilities.md
- PS-045-06 failure_recovery_idempotency.md
- PS-045-07 privacy_retention_abuse.md
- PS-045-08 observability_performance.md
- PS-045-09 contract_and_acceptance_tests.md
- PS-045-10 import_export_backup_rollback.md

## Public interfaces
`proximity.query` (read), `cell.register`, `cell.refresh` (system), `cell.export`. Events `cell.*`. Contracts in PS-045-04.

## Relationships, dependencies and integration
Upstream: F05 and F03/F04 listing events (active counts), F10 privacy approval, CTR-PRV-001 registry. Downstream: F06.S01.M03 filter (region facet), F06.S03.M01 relevance (cell-hop distance), F12 narrowing alerts.

## Data ownership
Owns the cell registry state and budget counters. Cell definitions and K_MIN are owned by F10 through CTR-PRV-001; listing data by F01.

## Risk considerations
Trilateration by shifting queries; differencing between refreshes; sub-threshold counts revealing a single home; cells used as a proxy for home address in small towns; registry changes that quietly expose a person. Pseudonyms do not protect a home cell with one resident.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; K_MIN, budget and cell grid approved by F10; differencing review complete; federation rule confirmed with F11.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-045-01
- [x] [validation_rules.md](validation_rules.md) — PS-045-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-045-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-045-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-045-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-045-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-045-07
- [x] [observability_performance.md](observability_performance.md) — PS-045-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-045-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-045-10
