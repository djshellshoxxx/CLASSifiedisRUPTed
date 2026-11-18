# F17.S01.M03 — integration

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** F17.S01.

## Purpose and business behavior
Runs cross-module integration scenarios that prove the canonical contracts work together: event delivery and idempotency across modules (CTR-EVT-001), authorization across module boundaries (CTR-CAP-001), error envelopes (CTR-ERR-001), schema compatibility (CTR-SCH-001) and federation relay behavior (CTR-FED-001). Unit tests (`mod_unit`) and property tests (`mod_property`) do not cover these seams. Scenarios use synthetic data in isolated environments and never call live payment, identity or relay services.

## User stories
- As a module owner, I know that my event is applied exactly once by a consumer under duplicate delivery before I merge.
- As QA Lead, I can see which contract a failing scenario covers and who last changed it.
- As a privacy reviewer, I can confirm that integration fixtures contain no real personal data.

## Scope
- Six scenarios INT-EVT-01, INT-CAP-01, INT-ERR-01, INT-SCH-01, INT-FED-01, INT-COM-01.
- Scenario runner, fixture lint, quarantine handling.
- Excludes: unit assertions (`mod_unit`), generative invariants (`mod_property`), full user journeys (`mod_e2e`), load and chaos (F17.S02).

## Public interfaces
Scenario runner interface (CI) and result query. Events `integration_run.*`. Errors `INTEGR.*`. Detail in PS-135-04.

## Relationships, dependencies and integration
Upstream: F15.S02.M02 (`mod_relays`, relay behavior under test), F17.S01.M02 (`mod_property`, shared generators). Downstream: F17.S01.M04 (`mod_e2e`, reuses fixtures). Contracts: CTR-EVT-001, CTR-CAP-001.

## Data ownership
Owns scenario definitions, fixture sets and run records. Does not own contracts (CONTRACTS.md owners) or module behavior.

## Risk considerations
Tests that pass on mocks but fail in production wiring; fixtures leaking real data; flaky scenarios hiding real defects; tests calling live payment or relay endpoints; scenarios drifting from the contracts they claim to cover. Mitigations: scenario-to-contract mapping lint, personal-data lint, egress block, quarantine with independent clearance. No platform custody of money. Pseudonyms do not guarantee anonymity in test data.

## Completion criteria
Six scenarios pass on release candidate; lint and egress block in CI; flaky rate below target for 30 days (ASSUMPTION); D01 and D04 resolved for relay and barter scenarios.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-135-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-135-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-135-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-135-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-135-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-135-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-135-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-135-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-135-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-135-10 (SPEC-DRAFT-COMPLETE)
