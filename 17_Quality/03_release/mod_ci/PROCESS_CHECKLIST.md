# Process inventory and integration checklist — ci (pipeline definitions and run records)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-141-01 drafted; pipeline and run records
- [x] [validation_rules.md](validation_rules.md) — PS-141-02 drafted; CIPIPE codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-141-03 drafted; run lifecycle
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-141-04 drafted; run-keyed idempotency
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-141-05 drafted; runner and maintainer rights
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-141-06 drafted; runner loss and retry
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-141-07 drafted; log redaction
- [x] [observability_performance.md](observability_performance.md) — PS-141-08 drafted; pipeline duration budgets
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-141-09 drafted; TEST-PS-141-* list
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-141-10 drafted; definition versioning
- [ ] QA Lead approval (pending)
- [ ] Security Lead review of fork and secret rules (pending)
- [ ] Decision D07 default confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Map each required check to its owning test suite.
- [ ] Validate CIPIPE error codes against CTR-ERR-001 registry lint.
- [ ] Cover rollback of pipeline definitions and run-record retention.
