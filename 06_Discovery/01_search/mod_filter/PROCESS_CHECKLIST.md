# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — closed filter object, coarse cells only, stable filter hash.
- [x] [validation_rules.md](validation_rules.md) — facet, price-currency, region, date-span and keyword limits.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — saved-search states; digest and pause timing.
- [x] [commands_queries_events.md](commands_queries_events.md) — side-effect-free evaluation; saved-search events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — owner-only saved searches; public-only anonymous results.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — index outage, shard partial results, digest retry.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — keyword log scan, region query budget, scraping limits.
- [x] [observability_performance.md](observability_performance.md) — evaluate latency, partial results, digest lag.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, search lifecycle e2e.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — owner export, no inbound, flag-off behavior.

## Integration gates
- [ ] Confirm facet enum source with F01 taxonomy.
- [ ] Confirm region budget contract with F06.S02.M03 proximity.
- [ ] Validate `FILTER.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
