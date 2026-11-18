# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-073-01 drafted
  - [ ] Verify exponent for every ISO 4217 code in the enabled list against the published table
- [x] [validation_rules.md](validation_rules.md) — PS-073-02 drafted
  - [ ] Test that look-alike CAIP-19 identifiers are rejected
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-073-03 drafted
  - [ ] Test that disabling a currency leaves existing claims valid
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-073-04 drafted
  - [ ] Confirm registry events are PUBLIC and carry no user data
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-073-05 drafted
  - [ ] Dual control for asset enablement
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-073-06 drafted
  - [ ] Replay of registry events yields identical registry state
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-073-07 drafted
  - [ ] Confirm no user data in registry
- [x] [observability_performance.md](observability_performance.md) — PS-073-08 drafted
  - [ ] Lookup latency budget measured
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-073-09 drafted
  - [ ] Consumer contract tests for mod_rates, mod_precision and LocalMutiny consumer
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-073-10 drafted
  - [ ] Rollback test: registry versions preserved

## Integration gates
- [ ] Resolve canonical ownership (B-06) and register `cur_` (PENDING prefix) prefix.
- [ ] Validate typed errors (CURR.* codes), capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03).
- [ ] Complete Prompt 3 specification-quality review before implementation.
