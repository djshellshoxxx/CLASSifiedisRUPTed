# Process inventory and integration checklist — records

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; registry row and item flag
  - [x] Map federate_mode to CTR-FED-001 R02 rules
  - [ ] Review: Privacy Lead on class ceilings (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; RECORDS.* codes
  - [x] Never-federate and opt-in checks
  - [ ] Review: cell validation with CTR-PRV-001 owner (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; flag and registry lifecycle
  - [x] Withdrawal and retirement guards
  - [ ] Review: retirement guard with mod_portable owner (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; command to event map
  - [x] Consumer confirmation placeholder
  - [ ] Review: event names with Platform Lead (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; owner-only flags
  - [x] Actor × action matrix
  - [ ] Review: dual control on class raise (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; atomic flag change
  - [x] Fail-closed bundling on registry outage
  - [ ] Review: fault plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; cell suppression and toggle limit
  - [x] K_MIN and toggle ASSUMPTIONS recorded
  - [ ] Review: K_MIN with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; flag latency and counts
  - [x] Label rule without IDs
  - [ ] Review: budgets (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-084-01..09
  - [x] Requirement-to-test map
  - [ ] Review: fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; registry import never activates
  - [x] Import-as-proposal rule
  - [ ] Review: registry export visibility (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies.
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
