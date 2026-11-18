# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — one return per rental, server-computed lateness, coarse place only.
- [x] [validation_rules.md](validation_rules.md) — early window, single declaration, owner window, checklist completeness.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — owner silence closes without confirmation; late return never auto-charged.
- [x] [commands_queries_events.md](commands_queries_events.md) — four commands; damage delegated; deposit release by event.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — renter declares, owner confirms, system closes.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — timer jobs, deposit request saga, server-time lateness.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — coarse place, note retention, damage-report cap.
- [x] [observability_performance.md](observability_performance.md) — transitions, lateness buckets, owner-window alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, both close flows.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — participant export, no inbound data, flag-off behavior.

## Integration gates
- [ ] Agree release-request contract with F05.S01.M02 deposits.
- [ ] Confirm damage link contract with F05.S02.M03 damage.
- [ ] Validate `RETURN.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
