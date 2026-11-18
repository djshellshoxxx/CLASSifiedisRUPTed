# F06.S03.M02 — fairness

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01/F02/F06 accountable; F12 Trust and Safety consulted). **Parent:** F06.S03.

## Purpose and business behavior
Apply explicit, published limits to the ordering of search results after relevance scoring: a cap on promoted (paid-placement) slots that are always labelled, a limit on how many results one seller account can take from a page, and an aggregated audit of exposure. This module enforces configured constraints. It does not guarantee fairness, does not sell rank beyond the cap, and does not decide relevance (D02 and D06 context; limits ASSUMPTION, OPEN).

## User stories
- As a seeker, I can tell paid placements from organic results, and paid results never fill most of a page.
- As a seller, I know the rules that limit how many of my listings appear together, and I can see the policy version.
- As an operator, I can change the caps only with a second approver, and I see aggregate exposure without seller-level detail.

## Scope
- PS-046-01 domain_schema.md
- PS-046-02 validation_rules.md
- PS-046-03 workflow_state_machine.md
- PS-046-04 commands_queries_events.md
- PS-046-05 authorization_capabilities.md
- PS-046-06 failure_recovery_idempotency.md
- PS-046-07 privacy_retention_abuse.md
- PS-046-08 observability_performance.md
- PS-046-09 contract_and_acceptance_tests.md
- PS-046-10 import_export_backup_rollback.md

## Public interfaces
Internal `fairness.apply` used by relevance service. Policy commands `rank_policy.draft`, `rank_policy.activate`, `rank_policy.retire`. Queries `exposure.summary` (aggregated). Events `rank_policy.*`.

## Relationships, dependencies and integration
Upstream: F06.S03.M01 relevance (ordered candidates), F09 promotion records (paid placement entitlement only; money in CTR-COM-001 claims). Downstream: F06.S01 search results, F12 abuse review, F16 audit.

## Data ownership
Owns `rank_policy` configuration and `exposure_audit` aggregates. Listing data F01; claims F09; seller identity F07.

## Risk considerations
Paid placement disguised as organic results; seller splitting into many accounts to dominate a page; operator favoritism in cap changes; audit rows that re-identify sellers; caps failing open silently. No platform custody; promotion money is outside this module.

## Completion criteria
All 10 canonical process files at SPEC-DRAFT-COMPLETE; caps and label wording approved by F06 and F12; linkage rules agreed with F07; fail-open decision recorded.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-046-01
- [x] [validation_rules.md](validation_rules.md) — PS-046-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-046-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-046-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-046-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-046-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-046-07
- [x] [observability_performance.md](observability_performance.md) — PS-046-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-046-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-046-10
