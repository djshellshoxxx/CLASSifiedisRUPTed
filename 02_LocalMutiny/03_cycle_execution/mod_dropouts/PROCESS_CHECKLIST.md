# Process inventory and integration checklist — F02.S03.M03 mod_dropouts

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — closed reason enum; lock references by ID
- [x] [validation_rules.md](validation_rules.md) — lock-confirm and attest deadlines
- [x] [workflow_state_machine.md](workflow_state_machine.md) — OPEN, RESOLVING and four terminal outcomes
- [x] [commands_queries_events.md](commands_queries_events.md) — withdraw, report, resolve
- [x] [authorization_capabilities.md](authorization_capabilities.md) — one report per reporter; operator reason access by grant only
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — no resolution while a lock is HELD
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — griefing and false-report controls
- [x] [observability_performance.md](observability_performance.md) — dropout rate by cycle size
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — 2, 3 and 4 party scenarios
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — own-involvement export; no federated import in MVP

## Integration gates
- [ ] Confirm mod_lock release acknowledgement contract.
- [ ] Confirm mod_recovery escalation contract.
- [ ] Confirm compensation claims reference CTR-COM-001 only (no money fields here).
- [ ] Validate CYC_DROPOUT.* codes against CTR-ERR-001.
