# Process inventory and integration checklist — mod_variants

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-009-01: 0–25 variants per listing, closed key registry, status active/archived.
- [x] [validation_rules.md](validation_rules.md) — PS-009-02: limit, key, value, duplicate-combination and in-use rules with VARIANT codes.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-009-03: active to archived only; archive is terminal.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-009-04: three commands on listing revision; listing.variant_* events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-009-05: owner via lst.update; archived rows hidden from non-owners.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-009-06: revision conflicts, archive/proposal race, offline pending queue (D08).
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-009-07: PUBLIC class, PII label pattern, RET-ACC retention.
- [x] [observability_performance.md](observability_performance.md) — PS-009-08: rejection-ratio alert, read p95 for 25 variants.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-009-09: TEST-PS-009-01 to -10 mapped to layers.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-009-10: export with listing, archive-not-delete rollback.

## Integration gates
- [ ] Resolve `var` prefix and `VARIANT` registry entries (PENDING CTR-ID-001, CTR-ERR-001).
- [ ] Confirm listing revision consumer list with F01.S01.M02 and F01.S03.M01.
- [ ] Record unresolved choices in DECISIONS.md (D07, D08 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
