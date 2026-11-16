# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE. Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

[x] marks a process spec as written. Sub-items marked [ ] need an external dependency or review and are not claimed done.

- [x] [domain_schema.md](domain_schema.md) — PS-007-01
  - [x] Fields, classes and constraints written; no precise-location, contact or payment field
  - [x] Consumers mapped: index, offers, F12, F13, export
  - [ ] PENDING CTR-LST-001 mapping of shared listing fields
  - [ ] F10 review of `budget_max` class (ASSUMPTION)
- [x] [validation_rules.md](validation_rules.md) — PS-007-02
  - [x] Rule table and `WANTED.*` codes written
  - [x] Contact and address text rules defined
  - [ ] 200-item fixture set built and measured
  - [ ] F14 accessibility review of error summary
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-007-03
  - [x] Eight states and transition table written
  - [x] Expiry and suspension guards written
  - [ ] QA Lead review of property-test model
  - [ ] F12 Trust & Safety review of suspend and remove path
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-007-04
  - [x] Command signatures, capabilities and error sets written
  - [x] Event list and payload rules (no `owner_account_id`) written
  - [ ] Payload size check against CTR-EVT R12 in load test
  - [ ] D08 offline command set reviewed
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-007-05
  - [x] Action matrix and field visibility written
  - [x] Moderation requires `cas_` grant
  - [ ] F16 Security Lead review
  - [ ] F07 session contract confirmed
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-007-06
  - [x] Retry, outbox and sweeper parameters written
  - [x] Offline pending-state rule written (never shown as published before ack)
  - [ ] Chaos scenarios scheduled
  - [ ] Dead-letter runbook written
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-007-07
  - [x] Retention table written (D07 PROVISIONAL)
  - [x] Abuse controls and thresholds written (ASSUMPTION)
  - [ ] F10 Privacy Lead review
  - [ ] F12 review of scam-pattern wording list
- [x] [observability_performance.md](observability_performance.md) — PS-007-08
  - [x] Metric list with no owner or content labels
  - [x] Log field allow and deny lists written
  - [ ] Load environment available
  - [ ] K_MIN aggregation confirmed with F10
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-007-09
  - [x] Consumer contract list and TEST IDs written
  - [x] Traceability rule written
  - [ ] Consumer contract tests implemented (future prompt)
  - [ ] CTR-LST-001 release gate confirmed
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-007-10
  - [x] Export document, import rules and rollback table written
  - [x] Tombstone propagation rule written
  - [ ] D01 federated envelope decision resolved
  - [ ] Restore drill scheduled
