# Process inventory and integration checklist — gates (release gate definitions and decisions)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-143-01 drafted; gate, decision and waiver records
- [x] [validation_rules.md](validation_rules.md) — PS-143-02 drafted; GATES codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-143-03 drafted; decision and waiver states
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-143-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-143-05 drafted; waiver approval rule
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-143-06 drafted; evidence pinning
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-143-07 drafted
- [x] [observability_performance.md](observability_performance.md) — PS-143-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-143-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-143-10 drafted
- [ ] QA Lead, Security Lead, Privacy Lead approval (pending)
- [ ] Governance Lead review of waiver lifetime (pending)
- [ ] D07 default confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Map every gate to its evidence source ID (mod_ci, mod_compatibility, F14, F10).
- [ ] Validate GATES error codes against CTR-ERR-001 registry lint.
- [ ] Cover rollback of gate definitions and waiver expiry.
