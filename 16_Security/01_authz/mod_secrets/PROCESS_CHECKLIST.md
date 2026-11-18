# Process inventory and integration checklist — F16.S01.M02 secrets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Security Lead, F16). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-127-01: KMS handle or HMAC verifier, one active overlap, SECRET class.
- [x] [validation_rules.md](validation_rules.md) — PS-127-02: no value on read paths, owner registry check, CI scan hit.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-127-03: rotation overlap, failed rotation keeps prior version.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-127-04: write-once values, 15-minute leases, `aud_` on every lease.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-127-05: no value-read capability, named-consumer leases.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-127-06: KMS fail-closed, in-memory leases only.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-127-07: values excluded from sinks, backups hold handles only.
- [x] [observability_performance.md](observability_performance.md) — PS-127-08: rotation-stuck and KMS error alerts.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-127-09: four consumer lease contracts and negatives.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-127-10: no value export or import, metadata export only.

## Integration gates (not yet done)
- [ ] `sec` prefix approved (CTR-ID-001).
- [ ] KMS ADR accepted by F16.
- [ ] Consumer lists approved per secret.
