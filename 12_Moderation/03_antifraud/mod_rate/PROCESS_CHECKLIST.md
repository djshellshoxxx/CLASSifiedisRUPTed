# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-099-01 specified; keyed subject tokens, no durable records
- [x] [validation_rules.md](validation_rules.md) — PS-099-02 specified; invalid input consumes no tokens
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-099-03 specified; GCRA states, signed policy versions
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-099-04 specified; internal consume, no public endpoint
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-099-05 specified; registered callers only
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-099-06 specified; per-class fail modes
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-099-07 specified; rotating keys, CGNAT handling
- [x] [observability_performance.md](observability_performance.md) — PS-099-08 specified; class-only labels
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-099-09 specified; reference GCRA equivalence
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-099-10 specified; no bucket data in backups

## Integration gates
- [ ] Map upstream F12.S03.M02 and F15.S02.M02 dependencies to rate inputs and store.
- [ ] Map downstream F06.S03.M02, F12.S02.M02 and F12.S03.M04 consumers to `rate.consume`.
- [ ] Validate RATE error codes with CTR-ERR-001 owner (F15).
- [ ] Record D01, D05, D07, D08 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
