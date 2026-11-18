# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-092-01 specified; appellant body classed PRIVATE_PERSONAL
- [x] [validation_rules.md](validation_rules.md) — PS-092-02 specified; window, evidence limit, reviewer conflict
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-092-03 specified; reversal hand-off to enforcement
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-092-04 specified; events carry no appeal text
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-092-05 specified; reviewer grant by case scope
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-092-06 specified; exactly-once reversal
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-092-07 specified; reporter identity hidden
- [x] [observability_performance.md](observability_performance.md) — PS-092-08 specified; SLA and backlog alerts
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-092-09 specified; cross-module reversal test
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-092-10 specified; owner and case export

## Integration gates
- [ ] Map upstream F12.S01.M02, F12.S02.M01 and F18.S02.M02 inputs to appeal targets.
- [ ] Map downstream F09.S02.M02 consumer of appeal state.
- [ ] Validate APPEALS error codes and `apl_` prefix with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Record D07 and D08 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
