# Process inventory and integration checklist — dedup

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; dedupe and equivocation keys
  - [x] Map keys to CTR-FED-001 R05, R06
  - [ ] Review: Platform Lead on index size (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; malformed, duplicate, equivocation, window
  - [x] DEDUP.WINDOW_EXCEEDED deferral rule
  - [ ] Review: deferral semantics with mod_delivery owner (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; recorded, equivocated, expired
  - [x] Evidence rows survive expiry while quarantined
  - [ ] Review: expiry horizon (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; internal check and lookup
  - [x] Consumer placeholder recorded
  - [ ] Review: event names (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; sys-only writes
  - [x] Peer cannot call dedupe
  - [ ] Review: evidence read dual control with Security Lead (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; atomic upsert, fail closed
  - [x] Race and outage tests defined
  - [ ] Review: fault plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; digest-only rows
  - [x] Purge and evidence retention rules
  - [ ] Review: retention with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; equivocation alert
  - [x] Peer class labels without IDs
  - [ ] Review: alert routing (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-087-01..09
  - [x] Replay fixture defined
  - [ ] Review: fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; rebuild from log
  - [x] Stale-restore block
  - [ ] Review: rebuild budget (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies.
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
