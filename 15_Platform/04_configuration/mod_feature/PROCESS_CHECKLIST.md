# Process inventory and integration checklist — F15.S04.M01 feature

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-123-01: slug, owner module, decision refs, default state.
- [x] [validation_rules.md](validation_rules.md) — PS-123-02: default-off rule for open decisions, acyclic requires.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-123-03: draft, active, deprecated, retired.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-123-04: four internal commands, catalog list.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-123-05: two approvers for activate and retire.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-123-06: whole-catalog push, last-known-good.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-123-07: no personal data, opaque slugs for sensitive features.
- [x] [observability_performance.md](observability_performance.md) — PS-123-08: catalog age alert, lifecycle counters.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-123-09: owner module declares slug.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-123-10: snapshot digest, whole-catalog import.

## Integration gates (not yet done)
- [ ] Initial catalog populated and lint-clean.
- [ ] Locale list from F14 confirmed.
- [ ] Feature slug decision (entity prefix or slug registry) recorded.
