# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — line items, digests only, EXIF removed before storage.
- [x] [validation_rules.md](validation_rules.md) — 7-day window, 20-line cap, evidence per line, cap per item.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — silence is never acceptance; baseline-less reports escalate.
- [x] [commands_queries_events.md](commands_queries_events.md) — five commands; excess routed to CTR-COM-001 claim.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — owner creates, renter responds, case-scoped photo access.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — deposit saga, timer job, offline acknowledgment queue.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — EXIF test, photo retention, per-rental report limits.
- [x] [observability_performance.md](observability_performance.md) — transitions, escalations, response time, timer lag alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, e2e to deposit request.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — photo-free default export, no inbound data.

## Integration gates
- [ ] Confirm baseline dependency on F05.S02.M01 handoff record fields.
- [ ] Validate `DAMAGE.*` codes against the CTR-ERR-001 registry.
- [ ] Confirm excess-claim path with F09 Commerce Lead.
- [ ] Complete Prompt 3 specification-quality review before implementation.
