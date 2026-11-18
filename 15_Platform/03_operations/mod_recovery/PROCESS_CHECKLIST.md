# Process inventory and integration checklist — F15.S03.M03 recovery

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-122-01: restore run and drill record fields; approver distinctness.
- [x] [validation_rules.md](validation_rules.md) — PS-122-02: isolation proof before production, source completeness, runbook active.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-122-03: fixed step order, read-only before promote.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-122-04: step-name enforcement, expected revision.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-122-05: ope-only recovery role, distinct approvers.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-122-06: no skipped revisions, post-restore replay safety.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-122-07: holds and tombstones before reads, 72 h isolated destruction.
- [x] [observability_performance.md](observability_performance.md) — PS-122-08: measured RTO and RPO per drill.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-122-09: consumer expectations of F02.S03.M04, F11.S03.M03, F17.S02.M02.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-122-10: restore as sole import path, evidence byte-identical.

## Integration gates (not yet done)
- [ ] Prefixes `rst` and `drl` approved (CTR-ID-001).
- [ ] First staging drill result recorded.
- [ ] D07 and D10 reviewed for restore impact in DECISIONS.md.
