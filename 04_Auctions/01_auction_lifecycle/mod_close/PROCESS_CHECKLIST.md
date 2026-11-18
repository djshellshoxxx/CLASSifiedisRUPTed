# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — one close record per auc_; reserve value absent
  - [ ] Confirm `winner` hiding rule in public projection with privacy lead
- [x] [validation_rules.md](validation_rules.md) — CLOSE.* codes; boundary at effective end
  - [ ] Confirm 1 s clock skew tolerance with platform owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — no PAID state; 48 h confirmation
  - [ ] Confirm 48 h confirmation window with F09 owner
- [x] [commands_queries_events.md](commands_queries_events.md) — public and private event split
  - [ ] Confirm `auction.closed` public fields with F13 notifications owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — sys-only close
  - [ ] Confirm operator cancel purpose `auction_integrity` with F12 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — unique record; atomic trx handoff
  - [ ] Confirm F09 outage handling at confirm with F09 owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — winner private until confirm; cancellation flag
  - [ ] Confirm retention periods with F10 owner and jurisdiction review (OPEN)
- [x] [observability_performance.md](observability_performance.md) — close lag; stuck confirmation alert
  - [ ] Confirm close-lag budget after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — sold, unsold, cancelled e2e
  - [ ] Confirm receipt-handoff fixture with F09.S02.M01 owner
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — archive without reserve
  - [ ] Confirm export size limit with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F04.S01.M03 owns close records; F09 owns `trx_` and `clm_`; F04.S01.M01 owns reserve value.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D04, D06, D07, D09, D10).
- [ ] Complete specification-quality review before implementation.
