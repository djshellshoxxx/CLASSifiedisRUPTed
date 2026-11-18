# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (QA Lead). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-137-01 drafted
- [x] [validation_rules.md](validation_rules.md) — PS-137-02 drafted
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-137-03 drafted
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-137-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-137-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-137-06 drafted
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-137-07 drafted
- [x] [observability_performance.md](observability_performance.md) — PS-137-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-137-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-137-10 drafted
- [ ] QA Lead review of all ten process specs (pending approval)
- [ ] Upstream CTR-CAP-001, CTR-EVT-001, CTR-ERR-001 approved (PENDING)
- [ ] Decisions D07 and quarantine policy confirmed (PROVISIONAL)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies with mod_ci and mod_gates.
- [ ] Validate typed errors and event versions against CTR-ERR-001 and CTR-EVT-001.
- [ ] Cover rollback and JUnit import in the manifest workflow.
- [x] Record unresolved choices in [DECISIONS.md](../../../DECISIONS.md) (D07).
