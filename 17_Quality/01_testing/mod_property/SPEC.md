# F17.S01.M02 — property

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** F17.S01.

## Purpose and business behavior
Checks invariants that must hold for all valid inputs rather than for hand-picked examples: exact money arithmetic on integer minor units (CTR-COM-001), ID format and uniqueness (CTR-ID-001), revision contiguity (CTR-EVT-001), coarse-cell privacy thresholds (CTR-PRV-001), schema compatibility (CTR-SCH-001) and cycle-matching constraints (D02). Each property is seeded and reproducible, and every failure becomes a stored counterexample.

## User stories
- As an engineer changing currency rounding, I see a minimal failing amount instead of a vague assertion failure.
- As a privacy reviewer, I can confirm that no coarse-cell count is published below the K threshold across 100,000 generated cases.
- As a QA Lead, I can replay any nightly counterexample on a clean checkout from its seed.

## Scope
- Six properties PROP-ID-01, PROP-COM-01, PROP-EVT-01, PROP-PRV-01, PROP-SCH-01, PROP-CYC-01.
- Generator library, shrinking, seed recording, counterexample store.
- Excludes: example-based unit tests (`mod_unit`), cross-module scenarios (`mod_integration`), load and chaos (F17.S02).

## Public interfaces
`property.register | run | replay | get | list_failing`; events `property_run.*`. Errors `PROPERTY.*`. Detail in PS-136-04.

## Relationships, dependencies and integration
Upstream: F17.S01.M01 (`mod_unit`, shared helpers). Downstream: F17.S01.M03 (`mod_integration`, reuses generators). Contracts: CTR-ID-001, CTR-COM-001.

## Data ownership
Owns property definitions, generators, seeds and counterexamples. Does not own contract semantics; a failing property points to the contract owner.

## Risk considerations
Generators that quietly produce only easy values; floats slipping into money paths; shrinking that hides the real cause; nightly budget overruns hiding failures as timeouts; generator output resembling real identifiers or locations. Mitigations: contract-derived generators, money-format lint, timeouts reported as `error`, synthetic-value lint. No platform custody of money. Pseudonyms do not guarantee anonymity of generated test accounts.

## Completion criteria
Six properties pass 100,000 nightly cases for 30 consecutive nights (ASSUMPTION); counterexample replay verified; D02 and D03 resolved for PROP-CYC-01 and PROP-COM-01.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-136-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-136-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-136-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-136-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-136-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-136-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-136-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-136-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-136-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-136-10 (SPEC-DRAFT-COMPLETE)
