# Process inventory and integration checklist — goods (controlled goods taxonomy)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-144-01 drafted; category and attribute records
- [x] [validation_rules.md](validation_rules.md) — PS-144-02 drafted; GOODS codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-144-03 drafted; category lifecycle
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-144-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-144-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-144-06 drafted; deprecation migration
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-144-07 drafted
- [x] [observability_performance.md](observability_performance.md) — PS-144-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-144-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-144-10 drafted
- [ ] Governance Lead approval (pending)
- [ ] F01 Marketplace Lead review of category migration (pending)
- [ ] Restriction-flag to rule-ID mapping complete (pending)

## Integration gates
- [ ] Every restriction flag resolves to a rule ID in mod_prohibited or mod_jurisdictions.
- [ ] GOODS codes pass CTR-ERR-001 registry lint.
- [ ] Rollback of taxonomy versions covered.
