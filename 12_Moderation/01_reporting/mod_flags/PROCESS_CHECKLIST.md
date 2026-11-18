# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md). Drafting items are checked; approval gates stay open until reviewed.

## Process drafts
- [x] [domain_schema.md](domain_schema.md) — PS-094-01 drafted; `rpt_` fields and visibility.
- [x] [validation_rules.md](validation_rules.md) — PS-094-02 drafted; FLG.* codes and check order.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-094-03 drafted; threshold priority only.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-094-04 drafted; reporter-free events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-094-05 drafted; triage queue scope.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-094-06 drafted; dedupe and offline queue.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-094-07 drafted; brigading and doxxing.
- [x] [observability_performance.md](observability_performance.md) — PS-094-08 drafted; alerts and budgets.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-094-09 drafted; test map.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-094-10 drafted; no federation of reports.

## Approval gates (open)
- [ ] Privacy Lead (F10) review of PS-094-07 and detail_text retention.
- [ ] Security Lead (F16) review of PS-094-05 and the global triage grant.
- [ ] Trust&Safety Lead sign-off on taxonomy and thresholds (PS-094-03, PS-094-04).
- [ ] QA Lead (F17) review of PS-094-09 test map.

## Integration gates
- [ ] Resolve B-06 ownership for report records in CONTRACTS.md.
- [ ] Validate FLG.* codes against CTR-ERR-001 registry lint.
- [ ] Record D07, D08 in DECISIONS.md as referenced (PROVISIONAL defaults).
- [ ] Confirm `mev_` dependency with mod_evidence (PENDING CTR-ID-001).
