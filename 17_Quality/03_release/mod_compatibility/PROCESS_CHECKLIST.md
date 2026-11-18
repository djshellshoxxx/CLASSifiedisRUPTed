# Process inventory and integration checklist — compatibility (support matrix and results)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-142-01 drafted; matrix cell and result records
- [x] [validation_rules.md](validation_rules.md) — PS-142-02 drafted; COMPAT codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-142-03 drafted; matrix and result states
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-142-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-142-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-142-06 drafted; stale-result rule
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-142-07 drafted; device data excluded
- [x] [observability_performance.md](observability_performance.md) — PS-142-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-142-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-142-10 drafted
- [ ] QA Lead approval (pending)
- [ ] F15 review of schema deprecation window (pending)
- [ ] F11 review of peer protocol versions (pending)
- [ ] D01 and D08 defaults confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Map each matrix cell to a test suite or device lab entry.
- [ ] Validate COMPAT error codes against CTR-ERR-001 registry lint.
- [ ] Cover rollback of matrix versions.
