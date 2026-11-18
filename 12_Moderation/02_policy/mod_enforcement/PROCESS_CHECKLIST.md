# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-096-01 specified; six action types, no money fields
- [x] [validation_rules.md](validation_rules.md) — PS-096-02 specified; case grant required, target type compatibility
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-096-03 specified; two-person suspension, renegotiation signal
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-096-04 specified; tombstone-only federation
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-096-05 specified; applier cannot self-approve or self-reverse
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-096-06 specified; at-least-once effects, fail-closed reads
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-096-07 specified; owner view omits moderator identity
- [x] [observability_performance.md](observability_performance.md) — PS-096-08 specified; effect latency and failure alerts
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-096-09 specified; cross-module renegotiation test
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-096-10 specified; no rollback command

## Integration gates
- [ ] Map upstream F07.S01.M01 and F12.S01.M01 inputs to enforcement targets and cases.
- [ ] Map downstream F01, F12.S01.M03 and F18 consumers to `enf.*` events.
- [ ] Validate ENFORCE error codes and `enf_` prefix with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Record D01, D04, D07, D09 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
