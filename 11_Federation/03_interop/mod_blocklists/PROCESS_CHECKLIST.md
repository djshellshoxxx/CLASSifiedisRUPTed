# Process inventory and integration checklist — blocklists

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

Review items stay open until F10 (privacy), F12 (moderation) and F16 (security) review. Integration gates stay open until PENDING registrations resolve.

- [x] [domain_schema.md](domain_schema.md) — PS-089-01
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [validation_rules.md](validation_rules.md) — PS-089-02
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-089-03
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-089-04
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-089-05
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-089-06
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-089-07
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [observability_performance.md](observability_performance.md) — PS-089-08
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-089-09
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-089-10
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (F12 split; PENDING F12 reason codes).
- [ ] Validate typed errors, capabilities, events and schema versioning (PENDING CTR-ID-001 `blk`, CTR-SCH-001 `blocklist.*`).
- [ ] Cover rollback, backup/restore, import/export and retention (PS-089-10, PS-089-07).
- [ ] Record unresolved choices in DECISIONS.md (D01, D07 PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
