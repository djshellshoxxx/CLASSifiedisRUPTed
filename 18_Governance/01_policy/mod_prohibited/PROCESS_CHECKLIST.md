# Process inventory and integration checklist — prohibited (prohibited-goods and content rule catalogue)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-146-01 drafted; rule and decision records
- [x] [validation_rules.md](validation_rules.md) — PS-146-02 drafted; PROHIB codes
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-146-03 drafted; classification outcomes
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-146-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-146-05 drafted
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-146-06 drafted; fail-closed rule
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-146-07 drafted; no listing text stored
- [x] [observability_performance.md](observability_performance.md) — PS-146-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-146-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-146-10 drafted
- [ ] Governance Lead, F12 and Privacy Lead approval (pending)
- [ ] Detection-signal exclusion review (pending)
- [ ] D07 default confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Every catalogue class resolves to goods category keys and jurisdiction rule IDs where applicable.
- [ ] PROHIB codes pass CTR-ERR-001 registry lint.
- [ ] Cover rollback of catalogue versions.
