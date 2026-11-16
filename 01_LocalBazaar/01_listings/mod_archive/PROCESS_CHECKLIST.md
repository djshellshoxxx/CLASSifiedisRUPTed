# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

Authoring items are checked when the process spec is written. Review gates stay open until the named owner signs off. Nothing here is claimed as reviewed or audited.

- [x] [domain_schema.md](domain_schema.md) — PS-001-01
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Privacy review (F10)
- [x] [validation_rules.md](validation_rules.md) — PS-001-02
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Security review (F16)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-001-03
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Moderation review (F12)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-001-04
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Platform contract review (F15)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-001-05
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Security review (F16)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-001-06
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Offline review (F15)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-001-07
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Privacy and retention review (F10)
- [x] [observability_performance.md](observability_performance.md) — PS-001-08
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Budget load test (F15)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-001-09
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Accessibility review (F14) and QA sign-off (F17)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-001-10
  - [x] Requirements, state and error contracts expanded
  - [x] Upstream and downstream mapped to canonical contracts
  - [x] Test IDs and acceptance criteria defined
  - [ ] Restore drill and migration fixtures run (F15)

## Integration gates
- [ ] Resolve PENDING CTR-LST-001 and CTR-NTF-001.
- [ ] Validate typed errors, capabilities, events and schema versioning against the canonical contracts.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D01, D04, D05, D07, D08, D10; all PROVISIONAL, unapproved).
- [ ] Complete Prompt 3 specification-quality review before implementation.
