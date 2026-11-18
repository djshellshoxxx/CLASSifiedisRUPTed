# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-072-01 drafted
  - [ ] Confirm findings store IDs and codes only
- [x] [validation_rules.md](validation_rules.md) — PS-072-02 drafted
  - [ ] Test each finding-type rule against golden fixtures
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-072-03 drafted
  - [ ] Confirm partial run cannot report `clean`
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-072-04 drafted
  - [ ] Confirm no command in module writes claim state
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-072-05 drafted
  - [ ] Dual-control test for FINAL-related finding resolution
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-072-06 drafted
  - [ ] Resume a run after adapter outage without double-counting
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-072-07 drafted
  - [ ] Verify operator views exclude amounts by default
- [x] [observability_performance.md](observability_performance.md) — PS-072-08 drafted
  - [ ] Must-be-zero alert for FINAL without adapter record
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-072-09 drafted
  - [ ] Synthetic drift fixture suite in CI
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-072-10 drafted
  - [ ] Rollback test: runs halt, findings retained

## Integration gates
- [ ] Resolve PENDING prefixes (rcn, rfd).
- [ ] Validate typed errors (COM.* codes), capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D04, D06).
- [ ] Complete Prompt 3 specification-quality review before implementation.
