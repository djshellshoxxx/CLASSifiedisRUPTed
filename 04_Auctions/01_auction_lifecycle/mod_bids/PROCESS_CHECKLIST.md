# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — bid_ opaque; amount in auction currency
  - [ ] Confirm `bid` class with CTR-ID-001 owner
- [x] [validation_rules.md](validation_rules.md) — BIDS.* codes; server-time auction state
  - [ ] Confirm increment rule with F04 owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — no withdrawal; void only with case scope
  - [ ] Confirm no-withdrawal rule with product owner
- [x] [commands_queries_events.md](commands_queries_events.md) — public events omit acc_ and timestamps
  - [ ] Confirm `bids.bid.outbid` consumers (F13) with notifications owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — seller block; pseudonym view
  - [ ] Confirm seller pseudonym visibility with privacy lead (D10)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — auction lock; lease; offline rejection on ack
  - [ ] Confirm 2 s lock lease with platform owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — 24-month retention; shill signals
  - [ ] Confirm retention periods with F10 owner and jurisdiction review (OPEN)
- [x] [observability_performance.md](observability_performance.md) — no bidder identifiers in logs
  - [ ] Confirm bid latency budgets after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — 1,000-bid concurrency suite
  - [ ] Confirm accessibility standard for CI (OPEN)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — archive CSV without acc_
  - [ ] Confirm export size and link expiry with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F04.S01.M02 owns bid records; F04 owns auctions; F09 owns claims.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D07, D08, D10).
- [ ] Complete specification-quality review before implementation.
