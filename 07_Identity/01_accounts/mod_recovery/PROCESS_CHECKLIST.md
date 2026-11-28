# Process checklist — F07.S01.M03 Account recovery

**Status:** SPECIFIED. > Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

- [x] [PS-053-01 Domain schema](domain_schema.md) — 3 requirements, tests mapped
- [x] [PS-053-02 Validation rules](validation_rules.md) — 4 requirements, tests mapped
- [x] [PS-053-03 Workflow state machine](workflow_state_machine.md) — 4 requirements, tests mapped
- [x] [PS-053-04 Commands, queries and events](commands_queries_events.md) — 6 requirements, tests mapped
- [x] [PS-053-05 Authorization and capabilities](authorization_capabilities.md) — 3 requirements, tests mapped
- [x] [PS-053-06 Failure recovery and idempotency](failure_recovery_idempotency.md) — 3 requirements, tests mapped
- [x] [PS-053-07 Privacy, retention and abuse](privacy_retention_abuse.md) — 4 requirements, tests mapped
- [x] [PS-053-08 Observability and performance](observability_performance.md) — 3 requirements, tests mapped
- [x] [PS-053-09 Contract and acceptance tests](contract_and_acceptance_tests.md) — 5 requirements, tests mapped
- [x] [PS-053-10 Import, export, backup and rollback](import_export_backup_rollback.md) — 3 requirements, tests mapped

## Integration gates

- [x] Ownership and dependencies declared (validated by `pnpm spec:check`).
- [x] Typed errors, capabilities, events and schema names validated.
- [x] Rollback, backup/restore, import/export and retention covered.
- [ ] Implementation landed with tests (Stage 4).
