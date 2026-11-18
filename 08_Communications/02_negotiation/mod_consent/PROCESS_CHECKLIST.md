# Process checklist — F08.S02.M02 consent

**Status:** SPEC-DRAFT-COMPLETE for specification authoring. Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md) rows PS-062-01 to PS-062-10.

## Specification authoring
- [x] [domain_schema.md](domain_schema.md) — PS-062-01 (`cns_` record, terms digest, version)
- [x] [validation_rules.md](validation_rules.md) — PS-062-02 (stale version, digest, quote)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-062-03 (given, withdrawn, superseded)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-062-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-062-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-062-06 (offline withdraw after lock)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-062-07
- [x] [observability_performance.md](observability_performance.md) — PS-062-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-062-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-062-10

## Cross-module gates (open)
- [ ] B-06 canonical owner for `cns_` recorded in CONTRACTS.md (F15/F16).
- [ ] Lock-event contract with F02.S03.M01 (F02 owner).
- [ ] Privacy Lead confirms separation from F10.S01.M01 privacy consent (F10).
- [ ] Security Lead review of replay and version binding (F16).
- [ ] Accessibility Lead review of consent screen (F14).
- [ ] QA Lead maps TEST-PS-062-* IDs to fixtures (F17).
