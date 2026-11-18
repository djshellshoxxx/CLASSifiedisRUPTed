# F03.S02.M01 — quotes

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F03). **Parent:** F03.S02.

## Purpose and business behavior
Lets a service provider send a priced, time-limited quote for one or more availability windows (`avw_`) of a service listing (`srv_`), and lets the addressed customer accept or decline it. Sending holds the windows for up to 72 hours. Acceptance atomically creates a transaction (`trx_`, CTR-COM-001) and a booking link. The platform records the quote and the acceptance only; no payment is collected, held or released here.

## User stories
- As a provider, I send a fixed-price quote for two time windows and can see which windows are held.
- As a customer, I see the price, tax mode and line items before I accept, and I cannot be charged by the platform.
- As a provider, a changed price is a new quote that the customer must accept again.

## Scope
- Owns: service quote records (`svq_`, pending prefix), quote states, send, accept, decline, withdraw and supersede commands.
- Consumes: service availability holds (F03.S01.M02), service listings and skills (F03.S01), transaction creation (F09).
- Out of scope: payment and settlement (F09.S02), milestones (F03.S02.M02), disputes (F03.S02.M03), negotiation messages (F08.S02.M01).

## Public interfaces
Commands `svcquote.create`, `svcquote.send`, `svcquote.accept`, `svcquote.decline`, `svcquote.withdraw`, `svcquote.supersede`; queries `svcquote.get`, `svcquote.list`; events `svcquote.*`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F03.S01.M01 `mod_skills`, F03.S01.M02 `mod_availability` (holds), F08.S02.M01 `mod_offers` (negotiation context), F09.S03.M03 `mod_precision` (currency handling). Downstream: F03.S02.M02 `mod_milestones`. Contracts: CTR-ERR-001, CTR-EVT-001, CTR-COM-001, CTR-SCH-001, CTR-CAP-001.

## Data ownership
Canonical owner of service quote records: F03.S02.M01 (this module), keyed by `svq_` (prefix PENDING CTR-ID-001). Canonical owner of transactions (`trx_`) and claims: F09 (CTR-COM-001). Canonical owner of pinned currency quotes (`qte_`): F09.S03. Availability windows: F03.S01.M02. Consumers reference these by full ID.

## Risk considerations
- Bait-and-switch price or scope changes after acceptance.
- Hold abuse: quotes sent only to block windows.
- Accept races with supersede or hold expiry.
- Customer identity disclosure before acceptance.
- Off-platform contact steering through scope text.
- Disputes over delivered service (handled by F03.S02.M03).

## Completion criteria
All ten process specs (PS-032-01 to PS-032-10) are SPEC-DRAFT-COMPLETE; `svq` prefix registration requested; accept atomicity specified; implementation, tests and security review are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-032-01
- [x] [validation_rules.md](validation_rules.md) — PS-032-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-032-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-032-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-032-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-032-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-032-07
- [x] [observability_performance.md](observability_performance.md) — PS-032-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-032-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-032-10
