# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — five features, weights summing to 1.00, cell-hop distance only.
- [x] [validation_rules.md](validation_rules.md) — weight sums, forbidden feature names, candidate and page limits.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — DRAFT, SHADOW for 7 days, dual-approved ACTIVE.
- [x] [commands_queries_events.md](commands_queries_events.md) — deterministic `search.rank`, fixed reason-code list.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — dual control on models; no grant enables forbidden inputs.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — 24-hour fallback, flagged partial results, offline stale cache.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — no coordinates, banded reputation, keyword and reputation gaming controls.
- [x] [observability_performance.md](observability_performance.md) — latency, reason distribution, shadow overlap, fallback alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, determinism and reason limits.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — public model summary, no import, recency-only baseline on flag off.

## Integration gates
- [ ] F06 sets default weights and recency constant (OPEN).
- [ ] F10 approves reputation band input (OPEN).
- [ ] Confirm index and proximity interfaces with F06.S01.M01 and F06.S02.M03.
- [ ] Validate `RELEV.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
