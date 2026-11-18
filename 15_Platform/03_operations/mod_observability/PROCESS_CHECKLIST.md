# Process inventory and integration checklist — F15.S03.M01 observability

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-121-01: closed record types, log allow-list, `actor_hash`, IP prefixes.
- [x] [validation_rules.md](validation_rules.md) — PS-121-02: 16 KiB cap, free-text refusal, redaction scan, cardinality cap.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-121-03: pending, firing, acknowledged, silenced, resolved.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-121-04: batch ingest, alert commands, aggregate query.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-121-05: sys-only ingest, case-scoped record reads.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-121-06: buffers, alert records never dropped first.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-121-07: no raw `acc_` in logs, 30-day operational retention.
- [x] [observability_performance.md](observability_performance.md) — PS-121-08: pipeline health and redaction-failure paging.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-121-09: emitter schema checks and code coverage.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-121-10: no raw export, telemetry not restored from backup.

## Integration gates (not yet done)
- [ ] Telemetry processor approved by F10 (PS-121-07 R05).
- [ ] `aud_` use for alert records approved by F16.
- [ ] D07 recorded in DECISIONS.md for telemetry retention.
