# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — deposit record fields, no custody field, one active deposit per rental.
- [x] [validation_rules.md](validation_rules.md) — amount cap, currency match, method limits, contact-data check on notes.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — eight statuses; release only after owner attest and renter confirm.
- [x] [commands_queries_events.md](commands_queries_events.md) — nine commands, each calling CTR-COM-001 for claims.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — participant-only access; case-scoped moderation; no `global` read.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — saga for claim plus deposit; offline queue of deposit writes.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — FINANCIAL_EVIDENCE retention, log redaction, proposal rate limit.
- [x] [observability_performance.md](observability_performance.md) — transition counters, release-lag histogram, no-attest alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, end-to-end deposit flow.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — owner export only, no inbound financial data, flag-off behavior.

## Integration gates
- [ ] Resolve cross-module ownership (F05 deposit vs F09 claim) in CONTRACTS.md.
- [ ] Validate CTR-ERR-001 codes `DEPOSITS.*` against the registry.
- [ ] Record D09 and D03 choices in DECISIONS.md review.
- [ ] Complete Prompt 3 specification-quality review before implementation.
