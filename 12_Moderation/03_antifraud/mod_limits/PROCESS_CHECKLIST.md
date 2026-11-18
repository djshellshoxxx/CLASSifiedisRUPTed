# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-098-01 specified; no usage counters stored
- [x] [validation_rules.md](validation_rules.md) — PS-098-02 specified; quota-exceeded body carries no counts
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-098-03 specified; staged rollout, one active policy per scope
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-098-04 specified; synchronous check, no quota events
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-098-05 specified; dual control for activation
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-098-06 specified; owner-side serialization, 1 h cache
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-098-07 specified; coarse cells only, K_MIN aggregates
- [x] [observability_performance.md](observability_performance.md) — PS-098-08 specified; check latency budget
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-098-09 specified; owner-module integration tests
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-098-10 specified; no staff identifiers in export

## Integration gates
- [ ] Map upstream F12.S03.M03 and F18.S01.M01 inputs to limit checks and jurisdiction codes.
- [ ] Map downstream F01.S01.M01 creation path and F12.S03.M01 signals.
- [ ] Validate LIMITS error codes and `lim_` prefix with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Record D05, D07, D08 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
