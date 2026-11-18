# Process inventory and integration checklist — portable

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; bundle manifest over CTR-EVT-001 envelopes
  - [x] Map manifest fields to CTR-FED-001 R04 signing input
  - [ ] Review: Platform Lead on item cap (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; federate and class filters
  - [x] Define PORTABLE.* codes
  - [ ] Review: Privacy Lead on class filter (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; export and import paths
  - [x] Import all-or-nothing transition rule
  - [ ] Review: delivery ack semantics with mod_delivery owner (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; command to event map
  - [x] Consumer list placeholder recorded
  - [ ] Review: event names with Platform Lead (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; owner-only export
  - [x] Actor × action matrix incl. quarantined peer
  - [ ] Review: operator exclusion with Security Lead (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; deferred unknown key
  - [x] Key-unknown deferral and build lock
  - [ ] Review: fault plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; per-audience pseudonyms, 7-day purge
  - [x] Restricted-class exclusion test
  - [ ] Review: pseudonym method with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; build and verify budgets
  - [x] Metric labels without IDs
  - [ ] Review: budgets on target hardware (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; two-node test
  - [x] Requirement-to-test map
  - [ ] Review: fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; tombstone compensation
  - [x] No-overwrite import and tombstone rollback
  - [ ] Review: B-06 split with Governance Lead (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (B-06 profile export).
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
