# Process checklist — F08.S02.M01 offers

**Status:** SPEC-DRAFT-COMPLETE for specification authoring. Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md) rows PS-063-01 to PS-063-10.

## Specification authoring
- [x] [domain_schema.md](domain_schema.md) — PS-063-01 (`ofr_`, minor-unit money)
- [x] [validation_rules.md](validation_rules.md) — PS-063-02 (OFFERS.* codes, quote rule)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-063-03 (open, countered, accepted)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-063-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-063-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-063-06 (server-time expiry)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-063-07 (FINANCIAL_EVIDENCE)
- [x] [observability_performance.md](observability_performance.md) — PS-063-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-063-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-063-10

## Payment and money gates (open)
- [ ] CTR-COM-001 R02/R03 money fixtures agreed with Commerce Lead (F09).
- [ ] D03 pinned-quote default confirmed or changed (PROVISIONAL).
- [ ] Finance review that offers are not treated as payment claims.

## Cross-module gates (open)
- [ ] B-06 canonical owner for `ofr_` recorded (F15/F16).
- [ ] Trust&Safety review of spam and probing limits (F12).
- [ ] Privacy Lead review of notification text (F10).
- [ ] Accessibility Lead review of money input and counter form (F14).
- [ ] QA Lead maps TEST-PS-063-* IDs to fixtures (F17).
