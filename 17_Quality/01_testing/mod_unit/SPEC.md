# F17.S01.M01 — unit

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** [F17.S01](../SPEC.md).

## Purpose and business behavior
Define how ClassRup unit tests are specified, mapped to stable `TEST-PS-*` IDs, executed in CI and reported. The module owns the unit test manifest (TEST-ID to test file to owning module), per-module coverage snapshots and the quarantine list for unit tests excluded from the gate. It does not own domain behavior: each module owns the test logic for its own records, and this module only checks that the mapping is complete, deterministic and auditable.

## User stories
- As a developer, I can find the unit test that proves a given TEST-ID without searching the repository.
- As a QA Lead, I can see which specified TEST-IDs still lack a unit test before a module leaves SPEC-DRAFT-COMPLETE.
- As a developer, I get a fast, deterministic unit run with no network access, a fixed clock and seeded randomness.

## Scope
- Process spec 01: `domain_schema.md` (PS-137-01)
- Process spec 02: `validation_rules.md` (PS-137-02)
- Process spec 03: `workflow_state_machine.md` (PS-137-03)
- Process spec 04: `commands_queries_events.md` (PS-137-04)
- Process spec 05: `authorization_capabilities.md` (PS-137-05)
- Process spec 06: `failure_recovery_idempotency.md` (PS-137-06)
- Process spec 07: `privacy_retention_abuse.md` (PS-137-07)
- Process spec 08: `observability_performance.md` (PS-137-08)
- Process spec 09: `contract_and_acceptance_tests.md` (PS-137-09)
- Process spec 10: `import_export_backup_rollback.md` (PS-137-10)

## Public interfaces
Internal only. Read API: manifest lookup by TEST-ID and unmapped-ID list per module. Events: `unit.TestMapped`, `unit.CoverageRecorded`, `unit.TestQuarantined` (envelope per [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)). Errors per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

## Relationships, dependencies and integration
Upstream: every module's `TEST-PS-*` IDs; CI runner from [mod_ci](../../03_release/mod_ci/SPEC.md). Downstream: [mod_gates](../../03_release/mod_gates/SPEC.md) reads pass state, coverage and quarantine counts. Integration tests are owned by sibling [mod_integration](../mod_integration/SPEC.md); property tests by [mod_property](../mod_property/SPEC.md).

## Data ownership
Owns manifest rows, coverage snapshots and quarantine records. Does not own test fixtures containing domain data; those follow the fixture rules in PS-137-07. Canonical identifiers come from [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md).

## Risk considerations
Specific to unit testing: (1) false green from tests that assert nothing or mock the unit under test; (2) quarantine used to hide real defects; (3) coverage gaming on validation and authorization code; (4) personal or location-like values in fixtures leaking into CI logs; (5) clock and RNG nondeterminism eroding trust in the gate. No security audit has been performed on this module.

## Completion criteria
Manifest covers 100% of TEST-IDs in SPEC files of modules in scope; all ten process specs approved; gate rules in PS-137-08 agreed with mod_gates; no quarantine without a named approver.

## Required process specification inventory
- [x] `domain_schema.md` — PS-137-01 drafted
- [x] `validation_rules.md` — PS-137-02 drafted
- [x] `workflow_state_machine.md` — PS-137-03 drafted
- [x] `commands_queries_events.md` — PS-137-04 drafted
- [x] `authorization_capabilities.md` — PS-137-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-137-06 drafted
- [x] `privacy_retention_abuse.md` — PS-137-07 drafted
- [x] `observability_performance.md` — PS-137-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-137-09 drafted
- [x] `import_export_backup_rollback.md` — PS-137-10 drafted
