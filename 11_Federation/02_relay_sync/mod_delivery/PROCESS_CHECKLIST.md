# Process inventory and integration checklist — delivery

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; batch and queue row
  - [x] Map batch fields to CTR-FED-001 transport (unsigned) fields
  - [ ] Review: Platform Lead on batch limits (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; size, rate, peer and expiry checks
  - [x] Cheap checks ordered before crypto
  - [ ] Review: rate limit values (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; queue lifecycle
  - [x] Peer revocation drop transition
  - [ ] Review: backoff parameters (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; send and receive
  - [x] Result ordering rule
  - [ ] Review: event names (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; peer-state gating
  - [x] Actor × action matrix incl. restricted peers
  - [ ] Review: restricted-peer send rule (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; retry by code
  - [x] Deferred-key and ACK_MISMATCH rules
  - [ ] Review: fault plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; jitter and restricted refusal
  - [x] Timing-jitter test defined
  - [ ] Review: purge window with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; queue depth and time-to-ack
  - [x] Peer-class labels
  - [ ] Review: alert thresholds (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-088-01..09
  - [x] Partition fixture
  - [ ] Review: fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; rebuild with receiver dedupe
  - [x] No payload export; acknowledged rows not resent
  - [ ] Review: rebuild procedure (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies.
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
