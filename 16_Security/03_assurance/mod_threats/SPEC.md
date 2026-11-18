# F16.S03.M01 — threats

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** [F16.S03](../SPEC.md).

## Purpose and business behavior
Maintain ClassRup's threat model register: one record per threat, covering security threats (STRIDE) and privacy threats (LINDDUN). Seeded threat areas are geolocation inference, metadata correlation, Sybil accounts, trade-graph deanonymization, claimed-versus-confirmed payments, non-atomic physical handover, moderation evasion and malicious federated peers. Each threat has an owner role, a likelihood and impact rating, linked controls (by full ID) and a review date. The module records threats, controls and residual-risk acceptances. It does not implement controls and does not certify the platform.

## User stories
- As a Security Lead, I can see every open threat for a module and which controls are verified by a test.
- As a Privacy Lead, I can co-approve any residual risk accepted for a LINDDUN category.
- As an incident responder, I can map an incident to an existing THR-ID instead of creating a duplicate threat.

## Scope
- Process spec 01: `domain_schema.md` (PS-133-01)
- Process spec 02: `validation_rules.md` (PS-133-02)
- Process spec 03: `workflow_state_machine.md` (PS-133-03)
- Process spec 04: `commands_queries_events.md` (PS-133-04)
- Process spec 05: `authorization_capabilities.md` (PS-133-05)
- Process spec 06: `failure_recovery_idempotency.md` (PS-133-06)
- Process spec 07: `privacy_retention_abuse.md` (PS-133-07)
- Process spec 08: `observability_performance.md` (PS-133-08)
- Process spec 09: `contract_and_acceptance_tests.md` (PS-133-09)
- Process spec 10: `import_export_backup_rollback.md` (PS-133-10)

## Public interfaces
Read and write commands for threats, controls and residual acceptances (PS-133-04). Events: `threats.ThreatRecorded`, `threats.ControlVerified`, `threats.ResidualAccepted`, `threats.ModelPublished` (envelope per [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)). Errors per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md). Consumers [mod_incident](../mod_incident/SPEC.md) and [mod_response](../mod_response/SPEC.md) reference THR-IDs by full ID only.

## Relationships, dependencies and integration
Upstream: privacy classes from [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md) (F10); capabilities from [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md) (F16 with F07). Controls live in other modules; this register links to them by path. Test verification references the test IDs owned by [mod_unit](../../../17_Quality/01_testing/mod_unit/SPEC.md) and [mod_e2e](../../../17_Quality/01_testing/mod_e2e/SPEC.md).

## Data ownership
Owns threat records, control links, residual acceptances and model versions. Does not own the controls, the incidents or the personal data they concern. Canonical threat record class: THR-IDs owned here only.

## Risk considerations
Specific to this register: (1) stale threat model that omits new federation or payment paths; (2) residual-risk acceptance used to close serious threats without evidence; (3) attack detail in the register acting as a roadmap if leaked; (4) controls linked but never verified by a test; (5) threat descriptions that drift into personal data about specific users. No external security audit has been performed; this register is not a certification.

## Completion criteria
All seeded threat areas have at least one THR record with owner, rating and review date; every linked control resolves to an existing path; LINDDUN categories co-reviewed by Privacy Lead; all ten process specs approved.

## Required process specification inventory
- [x] `domain_schema.md` — PS-133-01 drafted
- [x] `validation_rules.md` — PS-133-02 drafted
- [x] `workflow_state_machine.md` — PS-133-03 drafted
- [x] `commands_queries_events.md` — PS-133-04 drafted
- [x] `authorization_capabilities.md` — PS-133-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-133-06 drafted
- [x] `privacy_retention_abuse.md` — PS-133-07 drafted
- [x] `observability_performance.md` — PS-133-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-133-09 drafted
- [x] `import_export_backup_rollback.md` — PS-133-10 drafted
