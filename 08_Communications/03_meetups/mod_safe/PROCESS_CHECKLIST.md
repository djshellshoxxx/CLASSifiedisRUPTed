# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-066-01 drafted
  - [ ] Confirm no coordinate, address or landmark field exists in any schema version
- [x] [validation_rules.md](validation_rules.md) — PS-066-02 drafted
  - [ ] Register SAFE.* codes in CTR-ERR-001 registry
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-066-03 drafted
  - [ ] Test silent safe exit: counterparty receives no reason field
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-066-04 drafted
  - [ ] Confirm meetup_plan.* events are max_data_class PRIVATE_PERSONAL and excluded from federation
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-066-05 drafted
  - [ ] F10 review of trusted-contact grant scope and expiry
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-066-06 drafted
  - [ ] Offline safe-exit queue test under relay outage
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-066-07 drafted
  - [ ] Validate 7-day purge against CTR-PRV-001 class maximum
- [x] [observability_performance.md](observability_performance.md) — PS-066-08 drafted
  - [ ] Verify logs contain no venue, window or code values
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-066-09 drafted
  - [ ] Automate coordinate-field lint in CI
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-066-10 drafted
  - [ ] Test rollback leaves active plans to expire without deleting them

## Integration gates
- [ ] Resolve PENDING mtp_ and ven_ prefixes (F15).
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D05, D07, D08).
- [ ] Complete Prompt 3 specification-quality review before implementation.
