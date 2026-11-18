# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-103-01 specified; `ntf_` canonical ID, no body columns
- [x] [validation_rules.md](validation_rules.md) — PS-103-02 specified; template registry and forbidden-class scan
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-103-03 specified; monotonic read and dismiss
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-103-04 specified; events omit parameters
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-103-05 specified; recipient self-scope only
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-103-06 specified; operation IDs, dead-letter queue
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-103-07 specified; labels-only parameters, blocked-sender suppression
- [x] [observability_performance.md](observability_performance.md) — PS-103-08 specified; queue-to-delivery budget
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-103-09 specified; producer integration tests
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-103-10 specified; owner export without operation logs

## Integration gates
- [ ] Map upstream F13.S01.M01 (push acknowledgement) and F13.S02.M04 (preferences) to suppression and delivery states.
- [ ] Map downstream F08.S03.M03 producer contract for messaging notifications.
- [ ] Validate INAPP error codes and `ntf_` ownership with CTR-ERR-001 and CTR-ID-001 owners.
- [ ] Record D05, D07, D08 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
