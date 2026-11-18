# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-038-01
  - [x] Single authoritative time field (server_received_at) defined
  - [x] No stored second close time
  - [ ] Register `btm_` in CTR-ID-001 (lead)
- [x] [validation_rules.md](validation_rules.md) — PS-038-02
  - [x] Close boundary specified at ms precision
  - [x] Client hint bounds (60 s future, 24 h past) specified
  - [ ] Boundary fixtures reviewed by F04 (pending)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-038-03
  - [x] DEGRADED clock state with 3-sample hysteresis
  - [x] Offline bid classified at ack, not at device time
  - [ ] Skew threshold confirmed by F15 (pending)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-038-04
  - [x] No bidder_id in events
  - [x] Summary suppression at k < 5
  - [ ] Outbox pattern confirmed by F15 (pending)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-038-05
  - [x] Seller summary scoped to own auction
  - [x] Detail read limited to F12 case scope
  - [ ] Summary rate limit confirmed by F16 (pending)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-038-06
  - [x] Classifier retry window and reconciler specified
  - [x] Offline pending queue survives restart; purge on ack
  - [ ] D08 owner sign-off (pending)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-038-07
  - [x] Timing data classed PSEUDONYMOUS
  - [x] Timing data excluded from location use
  - [ ] F10 privacy review (pending; not audited)
- [x] [observability_performance.md](observability_performance.md) — PS-038-08
  - [x] Bidder identifiers excluded from logs
  - [x] Skew gauge and classification latency budget
  - [ ] Load plan reviewed by F15 (pending)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-038-09
  - [x] Boundary fixtures 9.999 s, 10 s, 120 s, close-1 ms
  - [x] Offline fixtures 0 s, 90 s, 10 min
  - [ ] Real clock-trace replay scheduled (future)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-038-10
  - [x] Export limited to requester rows
  - [x] Rollback does not reclassify silently
  - [ ] Restore drill scheduled (future)

## Integration gates
- [ ] Resolve boundary with 02_auction_integrity/mod_anti.
- [ ] Confirm close snapshot contract with 01_auction_lifecycle/mod_close.
- [ ] Validate typed errors, capabilities, events and schema versioning with owners.
- [ ] Cover rollback, backup/restore, import/export and retention in review.
- [ ] Record unresolved choices in DECISIONS.md (lead).
- [ ] Complete Prompt 3 specification-quality review before implementation.
