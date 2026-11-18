# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — `avw_` record; coarse region only
  - [ ] Register `avw` prefix with CTR-ID-001 owner
- [x] [validation_rules.md](validation_rules.md) — SVCAVAIL.* codes; DST gap rejected
  - [ ] Confirm RRULE subset (DAILY, WEEKLY) with F03 owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — 72 h hold; release on decline/expiry
  - [ ] Confirm hold release contract with F03.S02.M01 owner
- [x] [commands_queries_events.md](commands_queries_events.md) — hold keyed by (svq_, avw_)
  - [ ] Confirm `svq_` prefix for quotes with CTR-ID-001 owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — provider-only writes; anonymous counts
  - [ ] Confirm anonymous slot-count granularity with privacy lead
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — capacity-1 race; hold timer
  - [ ] Confirm offline pending-queue behavior for window edits with D08 owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — 30-day history; hold and write caps
  - [ ] Confirm retention and caps with F10 owner
- [x] [observability_performance.md](observability_performance.md) — no schedule values in logs
  - [ ] Confirm search budget after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — three DST zones
  - [ ] Confirm timezone fixtures with F15 owner
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — ICS export without customer data
  - [ ] Confirm export size and link expiry with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F03.S01.M02 owns service windows; F01.S03.M01 owns listing stock (review B-06).
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D05, D07, D08).
- [ ] Complete specification-quality review before implementation.
