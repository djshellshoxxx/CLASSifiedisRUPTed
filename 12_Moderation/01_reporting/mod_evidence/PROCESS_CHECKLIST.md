# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md). Drafting items are checked; approval gates stay open until reviewed.

## Process drafts
- [x] [domain_schema.md](domain_schema.md) — PS-093-01 drafted; requirements, fields and classes mapped to CTR-PRV-001.
- [x] [validation_rules.md](validation_rules.md) — PS-093-02 drafted; EVD.* codes and check order.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-093-03 drafted; transition table exhaustive.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-093-04 drafted; idempotency and revision rules.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-093-05 drafted; action matrix on CTR-CAP-001.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-093-06 drafted; scanner outage and offline queue.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-093-07 drafted; threats and retention.
- [x] [observability_performance.md](observability_performance.md) — PS-093-08 drafted; metrics and budgets.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-093-09 drafted; test map.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-093-10 drafted; legal-process export and rollback.

## Approval gates (open)
- [ ] Privacy Lead (F10) review of PS-093-07 and retention defaults.
- [ ] Security Lead (F16) review of PS-093-05, scanner choice and export path.
- [ ] Trust&Safety Lead sign-off on PS-093-03 and PS-093-04.
- [ ] QA Lead (F17) review of test map PS-093-09.

## Integration gates
- [ ] Resolve cross-module ownership (`evd_` versus `mev_`) in CONTRACTS.md.
- [ ] Validate typed errors EVD.* against CTR-ERR-001 registry lint.
- [ ] Cover rollback, backup/restore, import/export and retention (PS-093-10 tests).
- [ ] Record D05, D07, D08, D10 in DECISIONS.md as referenced (PROVISIONAL defaults).
