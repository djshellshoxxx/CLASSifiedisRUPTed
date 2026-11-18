# Process inventory and integration checklist — model

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; asset, boundary, flow, version fields
  - [x] Map each entity to CTR-PRV-001 classes and CTR-ID-001 prefixes (PENDING)
  - [ ] Review: Security Lead sign-off on zone list (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; zone × class matrix
  - [x] Define MODEL.* codes and HTTP categories
  - [ ] Review: CTR-FED-001 R03 alignment with federation owner (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; review and approval
  - [x] Separation-of-duties guard for approval
  - [ ] Review: review lead-time target with Privacy Lead (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; command to event map
  - [x] Map consumer list to DEPENDENCY_MATRIX.md (PENDING)
  - [ ] Review: event names with Platform Lead (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; reviewer roles
  - [x] Actor × action matrix for proposer, approver and CI
  - [ ] Review: Security Lead on self-approval rule (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; fail-closed CI check
  - [x] All-or-nothing approval and digest-based idempotency
  - [ ] Review: CI failure behavior with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; no personal data rule
  - [x] Privacy scan requirement and digest tamper check
  - [ ] Review: indefinite retention ASSUMPTION with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; coverage and drift metrics
  - [x] Coverage ratio and drift count definitions
  - [ ] Review: alert routing with on-call owner (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-081-01..09
  - [x] Requirement to test ID map
  - [ ] Review: fixture set with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; signed export, rollback
  - [x] Import-as-proposal rule and rollback target rule
  - [ ] Review: export key model with Security Lead (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies.
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
