# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-067-01 drafted
  - [ ] Confirm the cash profile adds no field to the CTR-COM-001 claim schema
- [x] [validation_rules.md](validation_rules.md) — PS-067-02 drafted
  - [ ] Test ceiling rejection for each configured currency exponent
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-067-03 drafted
  - [ ] Property test: no cash claim reaches EXTERNALLY_VERIFIED or FINAL in 10,000 sequences
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-067-04 drafted
  - [ ] Confirm disabling the method does not alter existing claims
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-067-05 drafted
  - [ ] Dual-control test for ceiling changes
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-067-06 drafted
  - [ ] Duplicate submit returns original claim (CTR-COM-001 failure rule)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-067-07 drafted
  - [ ] Collusion-pattern alert threshold agreed with F12
- [x] [observability_performance.md](observability_performance.md) — PS-067-08 drafted
  - [ ] Verify logs exclude amounts and counterparties
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-067-09 drafted
  - [ ] Wording scan for "paid", "payment received", "settled" below FINAL
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-067-10 drafted
  - [ ] Rollback test: disabled method keeps existing claims readable

## Integration gates
- [ ] Resolve cross-module ownership (claim record owned by CTR-COM-001 / F09).
- [ ] Validate typed errors (COM.* codes), capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D04, D06, D08, D09).
- [ ] Complete Prompt 3 specification-quality review before implementation.
