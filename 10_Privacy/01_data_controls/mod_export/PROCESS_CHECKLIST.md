# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-078-01: token hash only, manifest stored with row.
- [x] [validation_rules.md](validation_rules.md) — PS-078-02: versioned precise-location confirmation, constant-time token check.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-078-03: 7-day and 24 h-after-download expiry.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-078-04: download headers, single-use token.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-078-05: no operator path in MVP.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-078-06: promote only after manifest verification; range resume.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-078-07: keyed counterparty pseudonyms, encryption at rest.
- [x] [observability_performance.md](observability_performance.md) — PS-078-08: enum labels, zero-tolerance log scan.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-078-09: golden fixtures per scope.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-078-10: export-only; import owned by F11 and F07 by full ID.

## Integration gates
- [x] Cross-module ownership: export package (this module) distinct from federation bundle (F11.S01.M01) and profile portability (F07.S02.M01).
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001, CTR-SCH-001.
- [ ] Author CTR-PORT-001 (pending).
- [x] Unresolved choices recorded (D05, D07, D10 PROVISIONAL in process files).
- [ ] Complete Prompt 3 specification-quality review before implementation.
