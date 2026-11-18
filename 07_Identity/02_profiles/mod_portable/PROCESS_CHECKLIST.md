# Process checklist — mod_portable (F07.S02.M01)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: Identity&Trust Lead. See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — `bnd_`/`imj_` fields; no `acc_` in body; signing tag
- [x] [validation_rules.md](validation_rules.md) — ordered checks: size, schema, digest, signature, expiry
- [x] [workflow_state_machine.md](workflow_state_machine.md) — single download; apply once per digest
- [x] [commands_queries_events.md](commands_queries_events.md) — five routes, six events
- [x] [authorization_capabilities.md](authorization_capabilities.md) — owner-only; operators excluded
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — temp files, atomic apply, concurrent apply
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — class rules, preview without values, limits
- [x] [observability_performance.md](observability_performance.md) — metrics, 25 MiB latency budget
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — TEST-PS-055-01 to -20 mapped
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — MINOR readers, backups exclude files
