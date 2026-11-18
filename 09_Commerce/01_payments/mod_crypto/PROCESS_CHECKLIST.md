# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-068-01 drafted
  - [ ] Confirm the chain adapter and asset schemas hold no key or balance field
- [x] [validation_rules.md](validation_rules.md) — PS-068-02 drafted
  - [ ] Golden vectors for chain, asset, recipient and amount mismatch
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-068-03 drafted
  - [ ] Reorg replay test: dropped at 2 confirmations and after FINAL
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-068-04 drafted
  - [ ] Confirm adapter commands accept only sys_ principals
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-068-05 drafted
  - [ ] Test that adapters cannot write cash or in-kind claims
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-068-06 drafted
  - [ ] Two-provider disagreement test
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-068-07 drafted
  - [ ] F10 review of address-to-account linkage disclosure text
- [x] [observability_performance.md](observability_performance.md) — PS-068-08 drafted
  - [ ] Verify logs exclude addresses and tx hashes
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-068-09 drafted
  - [ ] Automate CTR-COM-001 tests 05, 07, 08 for crypto
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-068-10 drafted
  - [ ] Rollback test: disabled adapter keeps prior verification records

## Integration gates
- [ ] Resolve PENDING prefixes and registry owners (F15).
- [ ] Validate typed errors (COM.* codes), capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D04, D06, D09).
- [ ] Complete Prompt 3 specification-quality review before implementation.
