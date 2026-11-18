# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-075-01 drafted
  - [ ] Confirm quote schema matches CTR-COM-001 quote object exactly
- [x] [validation_rules.md](validation_rules.md) — PS-075-02 drafted
  - [ ] Reject user-supplied rate input in every API path (test)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-075-03 drafted
  - [ ] Test consented quote survives expiry of the quote
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-075-04 drafted
  - [ ] Confirm `quote.issue` is sys-only
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-075-05 drafted
  - [ ] Test source operator cannot read party data
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-075-06 drafted
  - [ ] Source outage: no quote issued, error returned
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-075-07 drafted
  - [ ] Quote-shopping rate limit tested
- [x] [observability_performance.md](observability_performance.md) — PS-075-08 drafted
  - [ ] Divergence and staleness alerts tested
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-075-09 drafted
  - [ ] Replay of recorded source responses in CI
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-075-10 drafted
  - [ ] Rollback test: issued quotes remain valid for consented proposals

## Integration gates
- [ ] Resolve source list and `rsrc` prefix (F15, Commerce Lead).
- [ ] Validate typed errors (RATE.* codes), capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03).
- [ ] Complete Prompt 3 specification-quality review before implementation.
