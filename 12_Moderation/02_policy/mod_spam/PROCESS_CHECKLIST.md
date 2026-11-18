# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-097-01 specified; message verdicts metadata-only
- [x] [validation_rules.md](validation_rules.md) — PS-097-02 specified; verification before federated scoring
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-097-03 specified; 7-day quarantine expiry
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-097-04 specified; no confidence on message events
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-097-05 specified; reviewers cannot read message verdicts
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-097-06 specified; listing fail-closed, message fail-open
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-097-07 specified; canary tests, rotating feature keys
- [x] [observability_performance.md](observability_performance.md) — PS-097-08 specified; per-locale false-positive reporting
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-097-09 specified; model regression gate
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-097-10 specified; model pinning and rollback

## Integration gates
- [ ] Map upstream F12.S03.M02 and F12.S03.M03 signals to spam inputs.
- [ ] Map downstream F01.S02.M03 discovery filter and F12.S02.M03 abuse pipeline.
- [ ] Validate SPAM error codes and `spm_` prefix with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Record D01, D07, D08 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
