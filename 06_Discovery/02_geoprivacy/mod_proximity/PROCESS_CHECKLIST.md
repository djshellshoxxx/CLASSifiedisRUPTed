# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — registered cells only, cell-level centroid, no per-person location.
- [x] [validation_rules.md](validation_rules.md) — ring limit, precise-key rejection, budget, narrowing alert, K_MIN output filter.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PUBLISHED / MERGED_UP / SUPPRESSED at K_MIN 5.
- [x] [commands_queries_events.md](commands_queries_events.md) — read-only query, cell events, bucketed counts.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — public bucket reads; dual approval for cell changes.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — stale snapshot fallback, fail-closed budget store.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — sub-K_MIN never disclosed; differencing and trilateration controls.
- [x] [observability_performance.md](observability_performance.md) — latency, sub-K_MIN alert, snapshot age, budget hits.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — K_MIN boundary, ring-2 budget, e2e exhaustion.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — public-safe export, no peer import, fail-closed flag.

## Integration gates
- [ ] F10 approval of K_MIN, cell set and differencing review (OPEN).
- [ ] F11 confirmation of federation rule for PUBLISHED cells.
- [ ] Validate `PROXIM.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
