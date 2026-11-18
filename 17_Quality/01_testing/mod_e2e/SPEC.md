# F17.S01.M04 — e2e

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** [F17.S01](../SPEC.md).

## Purpose and business behavior
Define ClassRup's end-to-end test scenarios that drive the product through browser or PWA flows across modules: paid classified listing, ordinary local sale, two-party barter, three-, four- and N-party cycles, mixed-value compensation, cancellation and dispute, fraud and moderation, private messages, payments, and federation import and export. The module owns scenario definitions, synthetic fixture sets, run records and the device matrix. It does not own the flows themselves; each flow's behavior is specified by its own module.

## User stories
- As a QA Lead, I can see pass rate and last result for each of the twelve flows on main.
- As a developer, I can run one flow's scenarios locally against a fixture set without real accounts.
- As a Privacy Lead, I can confirm that e2e artifacts contain no personal data.

## Scope
- Process spec 01: `domain_schema.md` (PS-134-01)
- Process spec 02: `validation_rules.md` (PS-134-02)
- Process spec 03: `workflow_state_machine.md` (PS-134-03)
- Process spec 04: `commands_queries_events.md` (PS-134-04)
- Process spec 05: `authorization_capabilities.md` (PS-134-05)
- Process spec 06: `failure_recovery_idempotency.md` (PS-134-06)
- Process spec 07: `privacy_retention_abuse.md` (PS-134-07)
- Process spec 08: `observability_performance.md` (PS-134-08)
- Process spec 09: `contract_and_acceptance_tests.md` (PS-134-09)
- Process spec 10: `import_export_backup_rollback.md` (PS-134-10)

## Public interfaces
Internal: scenario registry and run records. Events: `e2e.ScenarioRegistered`, `e2e.RunCompleted`, `e2e.ScenarioQuarantined` (envelope per [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)). Errors per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

## Relationships, dependencies and integration
Covers flows owned by 01_LocalBazaar (for example [mod_publish](../../../01_LocalBazaar/01_listings/mod_publish/SPEC.md)), 02_LocalMutiny cycles (for example [mod_three](../../../02_LocalMutiny/02_cycle_matching/mod_three/SPEC.md)), 08_Communications, 09_Commerce and 11_Federation. Quarantine reuses the approval flow of [mod_unit](../mod_unit/SPEC.md). Contract-level checks are in [mod_integration](../mod_integration/SPEC.md).

## Data ownership
Owns scenario definitions, fixture set references, run records and artifact references. Does not own product data, production data or personas that map to real people.

## Risk considerations
Specific to e2e: (1) scenarios that pass while skipping the cycle or payment step they claim to cover; (2) flaky browser timing hiding real races in offline sync and messaging; (3) fixtures or screenshots carrying personal or location data; (4) test accounts reaching real payment rails; (5) a green suite that covers only happy paths for dispute and fraud flows. No security audit has been performed on test infrastructure.

## Completion criteria
Each of the twelve flows has at least one passing scenario on main; device matrix results recorded; no scenario depends on real accounts or real payment rails; all ten process specs approved.

## Required process specification inventory
- [x] `domain_schema.md` — PS-134-01 drafted
- [x] `validation_rules.md` — PS-134-02 drafted
- [x] `workflow_state_machine.md` — PS-134-03 drafted
- [x] `commands_queries_events.md` — PS-134-04 drafted
- [x] `authorization_capabilities.md` — PS-134-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-134-06 drafted
- [x] `privacy_retention_abuse.md` — PS-134-07 drafted
- [x] `observability_performance.md` — PS-134-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-134-09 drafted
- [x] `import_export_backup_rollback.md` — PS-134-10 drafted
