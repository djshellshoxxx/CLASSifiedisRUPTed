# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) (PS-013-01)
  - [x] Field-level schema, line caps and digest rule written
  - [x] Producers and consumers mapped (F02.S01.M02, F02.S01.M01, F01.S03.M01)
  - [x] Data class PSEUDONYMOUS confirmed at spec level (not audited)
- [x] [validation_rules.md](validation_rules.md) (PS-013-02)
  - [x] Every OFFER code listed with retryability
  - [x] Contact-pattern scan defined as rule list (MVP)
- [x] [workflow_state_machine.md](workflow_state_machine.md) (PS-013-03)
  - [x] Exhaustive transition table with lock-vs-withdraw race rule
- [x] [commands_queries_events.md](commands_queries_events.md) (PS-013-04)
  - [x] Event payloads exclude note text and listing titles
- [x] [authorization_capabilities.md](authorization_capabilities.md) (PS-013-05)
  - [x] Field visibility table and case-scoped moderation rule
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-013-06)
  - [x] Atomic submit and offline queue bound (50) defined
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-013-07)
  - [x] Rate limits and note purge rules defined
- [x] [observability_performance.md](observability_performance.md) (PS-013-08)
  - [x] Label set excludes IDs and content
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-013-09)
  - [x] Fixture classes and test IDs named
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-013-10)
  - [x] No MVP import; kill switch and export rules defined

**Receipts:** no receipt or payment evidence is produced here. Valuation amounts are referenced by `qte_` only (CTR-COM-001).
