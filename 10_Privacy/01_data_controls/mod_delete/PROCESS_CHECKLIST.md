# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-077-01: request row, unique active target, zero-content completion record.
- [x] [validation_rules.md](validation_rules.md) — PS-077-02: scope enum, target ownership as NOT_FOUND, 10 min reauth.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-077-03: cooling-off cancel, hold-driven partial completion.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-077-04: idempotent request, origin-only tombstones.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-077-05: no operator write path to subject requests.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-077-06: per-store resume, replay ledger, revoked-peer discard.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-077-07: evidence redaction, no recall of counterparty copies, 24 h propagation.
- [x] [observability_performance.md](observability_performance.md) — PS-077-08: enum-only labels, zero-tolerance log scan.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-077-09: six-store propagation and offline cancel tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-077-10: restore replays deletions before serving.

## Integration gates
- [x] Cross-module ownership resolved for deletion records (this module); commerce evidence routed to F09.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001, CTR-SCH-001.
- [x] Rollback, backup/restore and retention covered (PS-077-10).
- [x] Unresolved choices recorded (D07, D08, D05, D10 PROVISIONAL in process files).
- [ ] Complete Prompt 3 specification-quality review before implementation.
