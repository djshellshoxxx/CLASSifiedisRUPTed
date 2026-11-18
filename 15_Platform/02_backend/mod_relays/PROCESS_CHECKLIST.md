# Process inventory and integration checklist — relays (F15.S02.M01)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-118-01 authored
  - [ ] Register `rqi_` prefix (PENDING CTR-ID-001)
- [x] [validation_rules.md](validation_rules.md) — PS-118-02 authored
  - [ ] Verification order matches CTR-FED-001 fixtures
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-118-03 authored
  - [ ] Chaos test: kill worker during IN_FLIGHT
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-118-04 authored
  - [ ] Confirm batch endpoint path with F11 (PENDING)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-118-05 authored
  - [ ] Dual-control test for peer admission
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-118-06 authored
  - [ ] Equivocation quarantine path confirmed with F11
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-118-07 authored
  - [ ] Privacy Lead (F10) metadata inventory review
- [x] [observability_performance.md](observability_performance.md) — PS-118-08 authored
  - [ ] Peer label hashing approved
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-118-09 authored
  - [ ] Two-relay interop fixture set built
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-118-10 authored
  - [ ] Restore revalidation drill
