# Process inventory and integration checklist — mod_n

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-018-01: search run, routing record, lengths 5–8 only.
- [x] [validation_rules.md](validation_rules.md) — PS-018-02: length routing, snapshot limits, budget bounds.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-018-03: queued, running, completed, budget-exhausted runs.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-018-04: cycle.search_n and cycle_search.completed.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-018-05: sys_ matcher only; participant-scoped results.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-018-06: all-or-nothing output, deterministic reruns.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-018-07: long-cycle linkage risk, per-run candidate cap.
- [x] [observability_performance.md](observability_performance.md) — PS-018-08: budget-exhaustion ratio, run time by length.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-018-09: golden fixtures 5–8, routing test, budget test.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-018-10: replay of search runs by algorithm version.

## Integration gates
- [ ] Routing table signed off by mod_two, mod_three and mod_four owners.
- [ ] Library choice and licence verified (PENDING; no version pinned).
- [ ] Record unresolved choices in DECISIONS.md (D02 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
