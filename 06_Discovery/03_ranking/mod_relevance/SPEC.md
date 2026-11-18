# F06.S03.M01 — relevance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01/F02/F06 accountable; F10 Privacy Lead consulted on features). **Parent:** F06.S03.

## Purpose and business behavior
Score and order candidate listings for a search query from five declared features: text match from the index, recency, cell-hop distance, listing completeness, and a reputation band. Weights live in a versioned model that moves through shadow comparison before activation. Each result carries up to three reason codes so people can see why it appeared. The module uses no precise location, no personal data and no raw reputation score (D05 PROVISIONAL, unapproved; weights OPEN).

## User stories
- As a seeker, I see results ordered by a clear mix of text match, freshness, nearby areas, and listing completeness.
- As a seeker, I see short reasons such as "Text match" or "Nearby area" for each result.
- As an operator, I can compare a new model against the live one before it serves anyone.

## Scope
- PS-047-01 domain_schema.md
- PS-047-02 validation_rules.md
- PS-047-03 workflow_state_machine.md
- PS-047-04 commands_queries_events.md
- PS-047-05 authorization_capabilities.md
- PS-047-06 failure_recovery_idempotency.md
- PS-047-07 privacy_retention_abuse.md
- PS-047-08 observability_performance.md
- PS-047-09 contract_and_acceptance_tests.md
- PS-047-10 import_export_backup_rollback.md

## Public interfaces
`search.rank` (service query), `ranking_model.draft`, `ranking_model.activate`, `ranking_model.retire`, `ranking_model.export`. Events `ranking_model.*`. Contracts in PS-047-04.

## Relationships, dependencies and integration
Upstream: F06.S01.M01 index (text scores), F06.S01.M02 query (parsed query), F06.S02.M03 proximity (cell registry and hop distance), F07 reputation bands, F01 listing completeness. Downstream: F06.S03.M02 fairness (constraints on the ordered list), F06.S01.M03 filter (sort choice), F13 notifications only via saved searches.

## Data ownership
Owns `rmv_` ranking models and reason-code vocabulary. Listing data F01; reputation bands F07; text index F06.S01.M01.

## Risk considerations
Ranking that leaks location through distance; reputation becoming a proxy for identity; keyword stuffing; undisclosed weight changes; models served before comparison. No personal data is stored or used beyond declared bands.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; default weights and recency constant set by F06; reputation band use approved by F10; reason-code wording approved by F06.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-047-01
- [x] [validation_rules.md](validation_rules.md) — PS-047-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-047-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-047-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-047-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-047-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-047-07
- [x] [observability_performance.md](observability_performance.md) — PS-047-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-047-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-047-10
