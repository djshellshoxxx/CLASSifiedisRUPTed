# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-100-01 specified; tier only, no raw score stored
- [x] [validation_rules.md](validation_rules.md) — PS-100-02 specified; feature allow-list; payment inputs are claimed status only
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-100-03 specified; holds and step-up, never blocks consent or claims
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-100-04 specified; tier-free subject events
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-100-05 specified; two-reviewer escalation
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-100-06 specified; 15 min pending flag, no re-score after commit
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-100-07 specified; allow-list, counterparty generic view
- [x] [observability_performance.md](observability_performance.md) — PS-100-08 specified; fairness share metrics with K_MIN
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-100-09 specified; regression and fairness gates
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-100-10 specified; subject export without tiers

## Integration gates
- [ ] Map upstream F12.S03.M02 and F12.S03.M04 signals and limit hits to risk inputs.
- [ ] Map downstream F04.S02.M03 and F09.S01.M01 consumers to `risk.*` events.
- [ ] Validate RISK error codes and `rsk_` prefix with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Confirm claimed-only rule with CTR-COM-001 owner (F09).
- [ ] Record D04, D05, D06, D07, D09 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
