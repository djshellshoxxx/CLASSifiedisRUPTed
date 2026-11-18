# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-079-01: one class per field, hold requires two approvers in storage.
- [x] [validation_rules.md](validation_rules.md) — PS-079-02: 365-day hold cap, approval before lengthening.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-079-03: holds override expiry; auto-release at end date.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-079-04: hold events carry no subject IDs.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-079-05: no operator read of content through hold tooling.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-079-06: hold checked inside purge transaction.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-079-07: holds cannot extend a class beyond ends_at; tombstone dedupe window.
- [x] [observability_performance.md](observability_performance.md) — PS-079-08: class-violation zero-tolerance alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-079-09: overlap and auto-release tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-079-10: holds in backup manifests; signed evidence never migrated away.

## Integration gates
- [x] Cross-module ownership: retention policy owned here; deletion execution in F10.S01.M04; federation dedupe retention in F11.S02.M02 by full ID.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001, CTR-SCH-001.
- [x] Backup and rollback covered (PS-079-10).
- [x] Unresolved choices recorded (D07 PROVISIONAL; R07 OPEN).
- [ ] Complete Prompt 3 specification-quality review before implementation.
