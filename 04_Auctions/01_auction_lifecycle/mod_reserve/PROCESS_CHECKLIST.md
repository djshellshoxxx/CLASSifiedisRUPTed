# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — reserve embedded in auction; history append-only
  - [ ] Confirm `"0"` means no reserve with product owner
- [x] [validation_rules.md](validation_rules.md) — RESERVE.* codes; raise-before-bid rule
  - [ ] Confirm change limit of 5 per auction with F04 owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — MET one-way; set in bid transaction
  - [ ] Confirm lowering-below-high-bid rule (OPEN) with product owner
- [x] [commands_queries_events.md](commands_queries_events.md) — events carry no value
  - [ ] Confirm `auction.reserve.met` consumers (F13) with notifications owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — seller-only value
  - [ ] Confirm operator dual-control path with F12 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — invariant under races
  - [ ] Confirm reconciliation fallback with platform owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — value purged 30 days after close
  - [ ] Confirm purge period with F10 owner and jurisdiction review (OPEN)
- [x] [observability_performance.md](observability_performance.md) — no values in logs; reconciliation alert
  - [ ] Confirm set-latency budget after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — invariant and boundary suites
  - [ ] Confirm accessibility standard for CI (OPEN)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — seller export before purge
  - [ ] Confirm restore ordering with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F04.S01.M01 owns reserve values; F04.S01.M03 stores `reserve_met` only.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D07, D08, D10).
- [ ] Complete specification-quality review before implementation.
