# Process inventory and integration checklist — consent

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — drafted; consent fields mapped to CTR-PRV-001 classes
  - [x] Map consent fields to CTR-PRV-001 data classes and CTR-SCH-001 registry
  - [ ] Review: Privacy Lead sign-off on field classes (review gate)
- [x] [validation_rules.md](validation_rules.md) — drafted; purpose and notice-version rules
  - [x] Define consent error codes CONSENT.* with HTTP categories
  - [ ] Review: accessibility of validation messages (review gate)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — drafted; grant/withdraw/expire/supersede
  - [x] Exhaustive transition table with guards and side effects
  - [ ] Review: expiry job bound with platform SRE (review gate)
- [x] [commands_queries_events.md](commands_queries_events.md) — drafted; idempotency keys per command
  - [x] Map each command to its event and error codes
  - [ ] Review: consumer lag budget with notifications owner (review gate)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — drafted; subject-only writes
  - [x] Author actor × action × resource matrix
  - [ ] Review: Security Lead on operator dual-control rule (review gate)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — drafted; fail-closed checks
  - [x] Define fail-closed behavior and offline queue rules
  - [ ] Review: fault-injection plan with QA Lead (review gate)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — drafted; proof retention and toggle limits
  - [x] Define retention stages and abuse thresholds as ASSUMPTION
  - [ ] Review: retention durations with Privacy Lead (review gate)
- [x] [observability_performance.md](observability_performance.md) — drafted; metric labels exclude acc_
  - [x] Define four metrics and redaction rule
  - [ ] Review: log retention with Privacy Lead (review gate)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — drafted; TEST-PS-076-01..09
  - [x] Map every requirement ID to a test ID
  - [ ] Review: accessibility test scope with Accessibility Lead (review gate)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — drafted; restore reconciliation
  - [x] Define restore, import and rollback rules
  - [ ] Review: export format with Governance Lead (review gate)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (B-06 for consent class).
- [ ] Validate typed errors, capabilities, events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md.
- [ ] Complete Prompt 3 specification-quality review before implementation.
