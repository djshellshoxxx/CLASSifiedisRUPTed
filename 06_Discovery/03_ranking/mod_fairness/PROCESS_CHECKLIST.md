# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — policy caps, aggregated audit rows, keyed seller buckets.
- [x] [validation_rules.md](validation_rules.md) — cap ranges, mandatory "Promoted" label, two approvers.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — one ACTIVE policy per scope; activation retires prior.
- [x] [commands_queries_events.md](commands_queries_events.md) — deterministic re-rank call, audit per page.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — dual control, aggregated audit reads only.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — unchecked-page flag, queued audit, cached policy.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — daily key rotation, no sensitive inputs, seller-splitting controls.
- [x] [observability_performance.md](observability_performance.md) — apply latency, over-cap alert, unchecked-page alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, policy lifecycle e2e.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — public policy export, aggregated audit only, labels kept on rollback.

## Integration gates
- [ ] F06 and F12 approval of caps and label wording (OPEN).
- [ ] F07 agreement on seller-linkage signal.
- [ ] Validate `FAIRNESS.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
