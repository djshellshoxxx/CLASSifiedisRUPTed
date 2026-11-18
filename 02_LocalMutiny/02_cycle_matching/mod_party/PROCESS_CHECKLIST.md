# Process inventory and integration checklist — mod_party (cycle slots)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-019-01: slot binding (cyc_, par_, slot_index, cycle_version), status projection.
- [x] [validation_rules.md](validation_rules.md) — PS-019-02: one live slot per participant, index range, version match.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-019-03: pending, consented, withdrawn, dropped, locked, compensated.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-019-04: bind and withdraw with expected version.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-019-05: slot participant withdraws; cycle creators bind.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-019-06: double-bind race, withdrawal after consent.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-019-07: pseudonymous slots, withdrawal-pressure signal.
- [x] [observability_performance.md](observability_performance.md) — PS-019-08: blocked-slot count, bind latency.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-019-09: double-booking and withdrawal tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-019-10: binding replay, owner export of own slots.

## Integration gates
- [ ] Lead decision on `par_` canonical owner (F02.S01.M02 vs this module).
- [ ] Event and error registries updated (PENDING CTR-EVT-001, CTR-ERR-001).
- [ ] Record unresolved choices in DECISIONS.md (none new; references D04 and D08, PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
