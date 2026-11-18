# Process inventory and integration checklist — threat

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; threat record fields and scoring
  - [x] Map flow references to mod_model entries (PENDING prefix)
  - [ ] Review: Security Lead on scoring scale (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; mitigation-needs-test rule
  - [x] Define THREAT.* codes and categories
  - [ ] Review: data-detection regex list shared with PS-081-02 (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; acceptance and reopen
  - [x] Dual-approval guard and expiry reversion
  - [ ] Review: 180-day acceptance limit with Security Lead (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; command to event map
  - [x] Consumer list placeholder recorded
  - [ ] Review: event names with Platform Lead (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; restricted visibility
  - [x] Actor × action matrix and exploit-field visibility
  - [ ] Review: reviewer role list with Governance Lead (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; no partial reads
  - [x] Timer idempotency and all-or-nothing writes
  - [ ] Review: fault plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; restricted register
  - [x] Never federated; bulk-read alert
  - [ ] Review: closed-threat retention with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; unmitigated and overdue counts
  - [x] Metric targets and redaction
  - [ ] Review: dashboard access with Security Lead (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-082-01..09
  - [x] Requirement-to-test map
  - [ ] Review: seeded fixtures with QA Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; restricted export
  - [x] Import state restriction and rollback rule
  - [ ] Review: export key model with Security Lead (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (threat vs threats naming).
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
