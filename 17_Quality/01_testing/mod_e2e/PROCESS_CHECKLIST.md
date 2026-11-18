# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (QA Lead). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-134-01 drafted
- [x] [validation_rules.md](validation_rules.md) — PS-134-02 drafted
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-134-03 drafted
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-134-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-134-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-134-06 drafted
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-134-07 drafted
- [x] [observability_performance.md](observability_performance.md) — PS-134-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-134-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-134-10 drafted
- [ ] QA Lead review of all ten process specs (pending approval)
- [ ] Privacy Lead review of persona and artifact rules (pending approval)
- [ ] Decision D08 confirmed for offline scenarios (PROVISIONAL)

## Integration gates
- [ ] Confirm each flow's owning module accepts its scenario acceptance criteria.
- [ ] Validate typed errors and event versions against CTR-ERR-001 and CTR-EVT-001.
- [ ] Cover fixture rollback and artifact retention.
- [x] Record unresolved choices in [DECISIONS.md](../../../DECISIONS.md) (D08).
