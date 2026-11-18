# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-080-01: per-surface policy rows, counts-only attachment report.
- [x] [validation_rules.md](validation_rules.md) — PS-080-02: MVP format allowlist (JPEG, PNG, WebP); PDF and HEIC deferred.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-080-03: strip-before-store; quarantine on residual tag.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-080-04: egress filter in-process, fail-closed.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-080-05: dual approval for policy; no filter-disable path.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-080-06: temp-key promotion after residual scan.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-080-07: log allowlist, IP prefixes, federation omits attachment metadata.
- [x] [observability_performance.md](observability_performance.md) — PS-080-08: zero-tolerance residual-tag alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-080-09: synthetic corpus, seven-surface egress tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-080-10: backups and exports contain sanitised attachments only.

## Integration gates
- [x] Cross-module ownership: metadata rules here; attachment state in F08.S01.M03 by full ID.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001, CTR-SCH-001.
- [x] Backup and rollback covered (PS-080-10).
- [x] Unresolved choices recorded (D05, D07 PROVISIONAL in process files).
- [ ] Complete Prompt 3 specification-quality review before implementation.
