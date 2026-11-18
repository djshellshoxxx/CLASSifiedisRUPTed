# Process inventory and integration checklist — offline (quality tests)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-140-01 drafted; fixture_class and max_data_class rules stated
- [x] [validation_rules.md](validation_rules.md) — PS-140-02 drafted; OFFTEST codes registered
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-140-03 drafted; scenario and run transitions
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-140-04 drafted; idempotency keys per command
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-140-05 drafted; runner and maintainer rights
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-140-06 drafted; timeout and flake policy
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-140-07 drafted; synthetic-only fixtures
- [x] [observability_performance.md](observability_performance.md) — PS-140-08 drafted; reconnect-to-sync budget
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-140-09 drafted; TEST-PS-140-* list
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-140-10 drafted; scenario versioning
- [ ] QA Lead approval (pending)
- [ ] Privacy Lead review of fixture and log rules (pending)
- [ ] Cross-check with F15.S01.M01 queue contract, PS-116-* (pending)
- [ ] Decision D08 and D07 defaults confirmed or replaced (pending; both PROVISIONAL)

## Integration gates
- [ ] Resolve F15 ownership of pending-write records by full ID.
- [ ] Validate OFFTEST error codes against CTR-ERR-001 registry lint.
- [ ] Cover rollback of scenario versions and run-record retention.
