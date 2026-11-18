# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-071-01 drafted (earlier pass)
  - [ ] Align method enum with CTR-COM-001 (`onchain_transfer`)
- [x] [validation_rules.md](validation_rules.md) — PS-071-02 drafted (earlier pass)
  - [ ] Confirm RECEIPT.* codes are registered in CTR-ERR-001
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-071-03 drafted (earlier pass)
  - [ ] Confirm 7-day attestation wait is F10-approved
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-071-04 drafted
  - [ ] Confirm evidence events are not federated
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-071-05 drafted
  - [ ] Test evidence visibility before and after attestation
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-071-06 drafted
  - [ ] Interrupted evidence upload resumes without duplicate `evd_`
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-071-07 drafted
  - [ ] EXIF and GPS stripping test on reference image set
- [x] [observability_performance.md](observability_performance.md) — PS-071-08 drafted
  - [ ] Verify no per-claim logs
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-071-09 drafted
  - [ ] JCS golden vectors (≥ 50) pass in two implementations
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-071-10 drafted
  - [ ] Export round-trip: receipt signatures verify after export

## Integration gates
- [ ] Resolve cross-module ownership (`evd_` owned by F09; claims by CTR-COM-001).
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D06, D07).
- [ ] Complete Prompt 3 specification-quality review before implementation.
