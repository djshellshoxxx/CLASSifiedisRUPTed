# Process inventory and integration checklist — signatures

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

Review items stay open until F10 (privacy), F16 (security) and F11 (federation) review. Integration gates stay open until PENDING registrations resolve.

- [x] [domain_schema.md](domain_schema.md) — PS-085-01
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [validation_rules.md](validation_rules.md) — PS-085-02
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-085-03
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-085-04
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-085-05
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-085-06
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-085-07
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [observability_performance.md](observability_performance.md) — PS-085-08
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-085-09
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-085-10
  - [x] Expand requirements, state and error contracts for this process
  - [x] Map upstream producers, downstream consumers and canonical contracts
  - [ ] Review privacy, fraud, moderation, accessibility and offline behavior
  - [x] Define test fixtures and measurable acceptance conditions

## Integration gates
- [ ] Resolve cross-module ownership: F16.S02.M03 primitives and `key_` records vs this module (PROVISIONAL).
- [ ] Validate typed errors (`FED.*`), capabilities and schema versioning (PENDING CTR-SCH-001 `fed.signature`, `fed.signing_key`).
- [ ] Cover key rotation, key compromise, backup/restore and rollback (PS-085-10).
- [ ] Record unresolved choices in DECISIONS.md (D01, D10 PROVISIONAL or OPEN).
- [ ] Complete Prompt 3 specification-quality review before implementation.
