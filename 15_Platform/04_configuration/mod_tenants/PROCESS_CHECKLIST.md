# Process inventory and integration checklist — mod_tenants

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-125-01: tenant_id, slug, status, admin_ref and region_cells classed against CTR-PRV-001.
- [x] [validation_rules.md](validation_rules.md) — PS-125-02: slug pattern, reserved names, config allowlist, TEN.* codes.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-125-03: provisioning saga and offboarding terminal state.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-125-04: command signatures, idempotency scope, tenant.* events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-125-05: owner rule for admin; dual control for suspend and offboard.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-125-06: slug uniqueness by constraint; suspension within 60 s.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-125-07: RET-ACC, legal hold, slug enumeration limits.
- [x] [observability_performance.md](observability_performance.md) — PS-125-08: tenant metrics, p95 budgets, log redaction of admin_ref.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-125-09: TEST-PS-125-nn cases.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-125-10: export manifest, re-keyed import, config rollback.

## Module-specific integration gates
- [ ] Cross-check `tenant.*` event types against CTR-EVT-001 subscriber map.
- [ ] Cross-check `federation_mode` values against CTR-FED-001 peer scopes.
- [ ] Cross-check region_cells against the CTR-PRV-001 region cell set.
- [ ] Confirm the TEN.* code registry is added to CTR-ERR-001 catalogue.
