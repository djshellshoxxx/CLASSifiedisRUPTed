# Process inventory and integration checklist — F15.S03.M02 backups

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-120-01: scope set, manifest fields, `bkp` prefix pending.
- [x] [validation_rules.md](validation_rules.md) — PS-120-02: overlap, SECRET exclusion, parent chain, destination allow-list.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-120-03: complete only after verify; hold blocks purge.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-120-04: internal commands, `backup.*` events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-120-05: no export for any principal; dual-control administer.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-120-06: 64 MiB chunks, resume from last verified chunk.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-120-07: per-scope encryption, tombstone replay, signed evidence byte-identical.
- [x] [observability_performance.md](observability_performance.md) — PS-120-08: 15-minute RPO alert, throughput budget.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-120-09: manifest consumer tests, staging restore drill.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-120-10: no export path, isolated import only via restore.

## Integration gates (not yet done)
- [ ] CTR-ID-001 registry change for `bkp` approved.
- [ ] CTR-SCH-001 registration of `backup.manifest`.
- [ ] D07 and D10 recorded in DECISIONS.md.
