# F06.S01.M02 — query

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead. **Parent:** F06.S01.

## Purpose and business behavior
Accept a buyer's text search over local listings, validate it, scope it to registered region cells, run it against the index (F06.S01.M01 index), and return a paged, privacy-filtered result set. Query text is never stored. Results expose only PUBLIC and LOCATION_COARSE fields and never carry a precise centre or distance.

## User stories
- As a buyer, I type a search and get relevant listings from my chosen local cells, one page at a time.
- As a buyer who is not signed in, I can still search public listings within a fair-use budget.
- As a buyer on a flaky connection, I see my last results marked "last updated" instead of a blank screen.
- As an operator, I can tune token limits and budgets without a code deploy.

## Scope
Text parsing, token limits, cell scoping, paging with snapshot cursors, query budgets, aggregate counters. Not in scope: index maintenance (M01 index), filter predicates (M03 filter), proximity expansion (F06.S02.M03), ranking (F06.S03).

- [domain_schema.md](domain_schema.md) — PS-046-01
- [validation_rules.md](validation_rules.md) — PS-046-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-046-03
- [commands_queries_events.md](commands_queries_events.md) — PS-046-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-046-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-046-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-046-07
- [observability_performance.md](observability_performance.md) — PS-046-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-046-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-046-10

## Public interfaces
Query `discovery.search` and aggregate event `discovery.search.aggregate`. Signatures and error codes in [commands_queries_events.md](commands_queries_events.md). Error prefix `QUERY.`.

## Relationships, dependencies and integration
Upstream: mod_index (read model), mod_filter (predicates), F16 capabilities, F10 K_MIN and disclosure rules. Downstream: UI in F14 accessibility surfaces, observability (F15). Discovery index contract PENDING CTR-DSC-001.

## Data ownership
Owns no persisted query data. Owns rate-counter and aggregate-counter definitions. Listing and index data owned by F01 and mod_index.

## Risk considerations
Inference of user interests from query text; enumeration of cells and listings through paging or error differences; scraping; query-driven denial of service via long or token-heavy text; stale results presented as current; trilateration via location-scoped searches. No platform custody of money involved. Pseudonymous searching does not guarantee anonymity against operators with logs.

## Completion criteria
Process specs at SPEC-DRAFT-COMPLETE; PENDING CTR-DSC-001 resolved; F10 review of budgets and aggregates; F14 review of live-region behavior; test IDs mapped.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-046-01, SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-046-02, SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-046-03, SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-046-04, SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-046-05, SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-046-06, SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-046-07, SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-046-08, SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-046-09, SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-046-10, SPEC-DRAFT-COMPLETE
