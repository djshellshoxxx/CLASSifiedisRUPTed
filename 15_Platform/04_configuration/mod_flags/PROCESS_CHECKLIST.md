# Process inventory and integration checklist — F15.S04.M02 flags

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-124-01: key, feature slug, basis-point rollout, variants, expiry.
- [x] [validation_rules.md](validation_rules.md) — PS-124-02: key rules, safe-off defaults, approval for rollout-up.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-124-03: kill switch, expiry revert, retirement.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-124-04: evaluate returns values only.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-124-05: kill without approval, clear-kill with second approver.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-124-06: HMAC bucketing, 15-minute last-known-good.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-124-07: no location-precise attributes, values not logged.
- [x] [observability_performance.md](observability_performance.md) — PS-124-08: kill alert, default-source alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-124-09: SDK shape, consumer safe-off tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-124-10: whole-snapshot import, rollout values in backups.

## Integration gates (not yet done)
- [ ] F10 approves attribute allow-list (PS-124-07).
- [ ] Salt reset procedure agreed with F16.
- [ ] Kill-switch propagation measured with F17.
