# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — snapshot key (cyc_, revision); no standalone ID
  - [ ] Confirm `zero_value_reason` enum with F02 owner
- [x] [validation_rules.md](validation_rules.md) — VALUE.* codes registered
  - [ ] Confirm 15-digit minor-unit limit with F09.S03 owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — STALE on revision change or quote expiry
  - [ ] Confirm 5 s stale-propagation budget with platform owner
- [x] [commands_queries_events.md](commands_queries_events.md) — compute, get, declare_value
  - [ ] Confirm consumers of `valuation.snapshot_computed` (F02.S01.M04, F02.S02.M05) with their owners
- [x] [authorization_capabilities.md](authorization_capabilities.md) — slot-owner declare, participant read
  - [ ] Confirm listing-owner check path with F01 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — single-row compute, no partial writes
  - [ ] Confirm quote timeout (2 s) and retry schedule with F09.S03 owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — values never public; 50% advisory to F12
  - [ ] Confirm advisory threshold with F12 owner
- [x] [observability_performance.md](observability_performance.md) — no values in logs; partial-write alert
  - [ ] Confirm p95 compute budget after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — HALF_EVEN vectors at exponents 0, 2, 6
  - [ ] Confirm rounding vectors with F09.S03.M03 owner
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — export only; policy version kept per snapshot
  - [ ] Confirm export size limit with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F09.S03 owns quotes and rounding; F02.S04.M03 owns valuation-basis records (review M-16).
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D05, D07).
- [ ] Complete specification-quality review before implementation.
