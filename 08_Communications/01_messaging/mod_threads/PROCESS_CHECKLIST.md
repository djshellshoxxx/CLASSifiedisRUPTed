# Process checklist — F08.S01.M02 threads

**Status:** SPEC-DRAFT-COMPLETE for specification authoring. Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md) rows PS-061-01 to PS-061-10.

## Specification authoring
- [x] [domain_schema.md](domain_schema.md) — PS-061-01 (thread, message, attachment schema)
- [x] [validation_rules.md](validation_rules.md) — PS-061-02 (THREADS.* codes)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-061-03 (open, archived, locked)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-061-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-061-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-061-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-061-07
- [x] [observability_performance.md](observability_performance.md) — PS-061-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-061-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-061-10

## Cross-module gates (open)
- [ ] CTR-ID-001 registry rows for `thr_`, `msg_`, `att_` confirmed (F15).
- [ ] CTR-SCH-001 registration of message schemas (F15).
- [ ] Privacy Lead review of PRIVATE_PERSONAL handling and EXIF stripping (F10).
- [ ] Trust&Safety review of first-contact and repeated-body limits (F12).
- [ ] Accessibility Lead review of live-region announcements (F14).
- [ ] QA Lead maps TEST-PS-061-* IDs to fixtures (F17).
