# Process inventory and integration checklist — storage (F15.S02.M03)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-119-01 authored
  - [ ] Register `blb_` prefix (PENDING CTR-ID-001)
- [x] [validation_rules.md](validation_rules.md) — PS-119-02 authored
  - [ ] Polyglot, SVG and bomb fixtures refused
  - [ ] EXIF strip verified with metadata parser
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-119-03 authored
  - [ ] Scanner timeout path tested (15 min)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-119-04 authored
  - [ ] Response header audit (nosniff, inline only for images)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-119-05 authored
  - [ ] Owner-decision route audit
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-119-06 authored
  - [ ] Orphan sweeper chaos test
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-119-07 authored
  - [ ] CDN purge within 24 h confirmed
- [x] [observability_performance.md](observability_performance.md) — PS-119-08 authored
  - [ ] Checksum mismatch alert verified
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-119-09 authored
  - [ ] Synthetic media fixture set built
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-119-10 authored
  - [ ] Restore drill verifies 100% sha256
