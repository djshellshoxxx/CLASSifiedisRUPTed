# F06.S01.M03 — filter

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01/F02/F06 accountable). **Parent:** F06.S01.

## Purpose and business behavior
Define the facet filters a person applies to local search (category, listing type, condition, price in one currency, coarse region cells, availability dates, keywords), validate them, normalize them to a stable hash, evaluate them against the search index without precise location, and manage saved searches with daily digests. Filters narrow results; they never reveal precise location or rank listings.

## User stories
- As a seeker, I narrow results by category, price range in my currency, and two or three nearby coarse areas.
- As a seeker, I save a search and get one digest a day when new matches appear.
- As an operator, I see filter error rates without seeing keywords or who saved what.

## Scope
- PS-044-01 domain_schema.md
- PS-044-02 validation_rules.md
- PS-044-03 workflow_state_machine.md
- PS-044-04 commands_queries_events.md
- PS-044-05 authorization_capabilities.md
- PS-044-06 failure_recovery_idempotency.md
- PS-044-07 privacy_retention_abuse.md
- PS-044-08 observability_performance.md
- PS-044-09 contract_and_acceptance_tests.md
- PS-044-10 import_export_backup_rollback.md

## Public interfaces
`filter.evaluate`, `filter.save`, `filter.pause`, `filter.resume`, `filter.delete`, `filter.list`, `filter.export`. Events `saved_search.*`. Contracts in PS-044-04.

## Relationships, dependencies and integration
Upstream: F06.S01.M01 index (postings), F06.S02 geoprivacy (registered cells, query budget), F01 taxonomy (facet enums). Downstream: F06.S03 ranking (sort input), F13 notifications (digests), F07 accounts (ownership).

## Data ownership
Owns `sfl_` saved searches and filter normalization rules. Listing data belongs to F01; cells to F10 registry.

## Risk considerations
Keyword and facet combinations that identify a person or a home area; saved-search digests leaking to other users; scraping through repeated filters; currency mixing producing wrong price matches. Pseudonyms do not hide saved interests from the owner's digest.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; saved-search classification approved by F10; facet taxonomy confirmed by F01; quotas approved.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-044-01
- [x] [validation_rules.md](validation_rules.md) — PS-044-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-044-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-044-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-044-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-044-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-044-07
- [x] [observability_performance.md](observability_performance.md) — PS-044-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-044-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-044-10
