# Process inventory and integration checklist — api (F15.S02.M02)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-117-01 authored
  - [ ] Confirm `api_idempotency` PRIMARY KEY covers the D08 offline window
- [x] [validation_rules.md](validation_rules.md) — PS-117-02 authored
  - [ ] Load-test 64 KiB limit (ASSUMPTION)
  - [ ] Confirm `API.FLOAT_FORBIDDEN` against CTR-COM-001 R02 fixtures
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-117-03 authored
  - [ ] Chaos test: kill after commit, before response
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-117-04 authored
  - [ ] OpenAPI generated and diffed in CI
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-117-05 authored
  - [ ] Security Lead sign-off on public allow-list
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-117-06 authored
  - [ ] Breaker thresholds validated under load
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-117-07 authored
  - [ ] Privacy Lead (F10) review of access-log fields and IP hashing
- [x] [observability_performance.md](observability_performance.md) — PS-117-08 authored
  - [ ] Label cardinality test passes
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-117-09 authored
  - [ ] Fixtures for API.* codes added
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-117-10 authored
  - [ ] Restore drill passes RTO
