# Process inventory and integration checklist — F02.S03.M02 mod_lock

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — single HELD lock per item via partial unique index
- [x] [validation_rules.md](validation_rules.md) — consented-only acquisition; 16-item set limit
- [x] [workflow_state_machine.md](workflow_state_machine.md) — all-or-nothing acquisition; CONSUMED only on completion
- [x] [commands_queries_events.md](commands_queries_events.md) — acquire, release, extend with fences
- [x] [authorization_capabilities.md](authorization_capabilities.md) — system-only acquisition
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — racing acquires, orphan sweep, stale fence
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — uniform ITEM_UNAVAILABLE; probing rate limit
- [x] [observability_performance.md](observability_performance.md) — contention and orphan alerts
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — 2-party swap and 4-party conflict
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — expired HELD set to EXPIRED on restore

## Integration gates
- [ ] Confirm F01.S03.M01 consumes lock events idempotently.
- [ ] Confirm mod_dropouts release contract.
- [ ] Validate CYC_LOCK.* codes against CTR-ERR-001.
