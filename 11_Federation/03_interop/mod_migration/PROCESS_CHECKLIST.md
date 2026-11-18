# Process inventory and integration checklist — migration

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; run record, approvals, scope
  - [x] Map run fields to CTR-SCH-001 and CTR-ID-001 (prefix PENDING)
  - [ ] Review: Platform Lead on scope filters (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; hook, lossy, class and retired checks
  - [x] Lossless-only rule for signed evidence
  - [ ] Review: CTR-COM-001 claim handling with F09 owner (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; plan to rollback
  - [x] Two-approval guard and deadline
  - [ ] Review: rollback window with Platform Lead (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; four commands and five events
  - [x] Stale-plan rule noted
  - [ ] Review: event names (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; dual control, no mod access
  - [x] Actor × action matrix
  - [ ] Review: Security Lead on grant expiry (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; checkpoints and quarantine
  - [x] Kill-point resume test defined
  - [ ] Review: threshold value (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; content-free reports
  - [x] Class-raise block
  - [ ] Review: run retention with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; progress and verification metrics
  - [x] Verification gate metric
  - [ ] Review: throughput target on hardware (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-090-01..09
  - [x] Golden fixture set per path
  - [ ] Review: fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; verified backup gate
  - [x] Node-local plans
  - [ ] Review: backup restore test procedure (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies.
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
