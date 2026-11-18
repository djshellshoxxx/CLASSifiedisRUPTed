# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-074-01 drafted
  - [ ] Confirm rate_scale ≤ 18 and exponent ≤ 18 cannot combine into overflow beyond 39 digits without error
- [x] [validation_rules.md](validation_rules.md) — PS-074-02 drafted
  - [ ] Parser rejects `01`, `1.0`, `-1`, `1e3`, `NaN`, 40-digit inputs
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-074-03 drafted
  - [ ] Conversion pipeline stages tested with golden vectors
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-074-04 drafted
  - [ ] Confirm library API exposes no float entry point
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-074-05 drafted
  - [ ] Confirm no authorization decision depends on this module
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-074-06 drafted
  - [ ] Deterministic re-run of conversion with same inputs
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-074-07 drafted
  - [ ] Confirm no amount logging in library
- [x] [observability_performance.md](observability_performance.md) — PS-074-08 drafted
  - [ ] Benchmark conversion p99 budget
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-074-09 drafted
  - [ ] Golden vectors (≥ 500) in CI
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-074-10 drafted
  - [ ] Version pin of library tested across upgrades

## Integration gates
- [ ] Resolve library ADR and float lint.
- [ ] Validate typed errors (PREC.* codes), schema versioning of rule set.
- [ ] Cover rollback of rule-set version and retention of vector suite.
- [ ] Record unresolved choices in DECISIONS.md (D03).
- [ ] Complete Prompt 3 specification-quality review before implementation.
