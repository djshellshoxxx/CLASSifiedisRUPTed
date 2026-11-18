# Process inventory and integration checklist — transparency (aggregated transparency reports)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-148-01 drafted; report, figure and methodology records
- [x] [validation_rules.md](validation_rules.md) — PS-148-02 drafted; TRANSP codes; small-cell rule
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-148-03 drafted; draft to published
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-148-04 drafted
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-148-05 drafted; two-person publish
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-148-06 drafted; immutable publish
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-148-07 drafted; suppression and holds
- [x] [observability_performance.md](observability_performance.md) — PS-148-08 drafted
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-148-09 drafted
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-148-10 drafted
- [ ] Governance Lead and Privacy Lead approval (pending)
- [ ] F12 confirmation of aggregate sources (pending)
- [ ] D05 and D07 defaults confirmed or replaced (pending; PROVISIONAL)

## Integration gates
- [ ] Reconcile every published figure to its aggregate job ID.
- [ ] TRANSP codes pass CTR-ERR-001 registry lint.
- [ ] Cover rollback and correction of published reports.
