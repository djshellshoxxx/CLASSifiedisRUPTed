# Process inventory and integration checklist — jurisdictions (legal-rule register by region)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-145-01 drafted; region and rule records
- [x] [validation_rules.md](validation_rules.md) — PS-145-02 drafted; JURIS codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-145-03 drafted; rule lifecycle
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-145-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-145-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-145-06 drafted; version pinning
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-145-07 drafted; coarse region only
- [x] [observability_performance.md](observability_performance.md) — PS-145-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-145-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-145-10 drafted
- [ ] Governance Lead and Privacy Lead approval (pending)
- [ ] Qualified reviewer role assigned (pending)
- [ ] D05 and D07 defaults confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Map each rule to a goods category key from mod_goods.
- [ ] JURIS codes pass CTR-ERR-001 registry lint.
- [ ] Cover rollback and withdrawal of rule versions.
