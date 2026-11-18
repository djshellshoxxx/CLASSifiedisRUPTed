# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Security Lead). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-133-01 drafted
- [x] [validation_rules.md](validation_rules.md) — PS-133-02 drafted
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-133-03 drafted
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-133-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-133-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-133-06 drafted
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-133-07 drafted
- [x] [observability_performance.md](observability_performance.md) — PS-133-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-133-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-133-10 drafted
- [ ] Security Lead review of all ten process specs (pending approval)
- [ ] Privacy Lead review of LINDDUN categories (pending approval)
- [ ] Upstream CTR-CAP-001, CTR-PRV-001 approved (PENDING)
- [ ] Decisions D05, D07 confirmed (PROVISIONAL)

## Integration gates
- [ ] Resolve control-link targets with owners of mod_incident, mod_response and the feature modules that hold controls.
- [ ] Validate typed errors and event versions against CTR-ERR-001 and CTR-EVT-001.
- [ ] Cover model-version rollback and export tiers.
- [x] Record unresolved choices in [DECISIONS.md](../../../DECISIONS.md) (D05, D07).
