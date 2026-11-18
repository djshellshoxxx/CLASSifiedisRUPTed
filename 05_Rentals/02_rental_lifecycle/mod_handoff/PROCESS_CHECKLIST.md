# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — checklist codes, coarse region cell only, signed attestations.
- [x] [validation_rules.md](validation_rules.md) — window bounds, checklist completeness, participant check.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — COMPLETE needs both matching attestations; no verified-transfer claim.
- [x] [commands_queries_events.md](commands_queries_events.md) — `rental_handoff` namespace, disjoint from meetup handoff.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — participant-only attestation; case-scoped photo access.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — offline attestation queue, activation saga, expiry job.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — coarse place only, EXIF removal, scheduling caps.
- [x] [observability_performance.md](observability_performance.md) — transitions, time to complete, one-sided COMPLETE alert.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — contract, error table, e2e activation.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — participant export, no inbound data, flag-off behavior.

## Integration gates
- [ ] Lead lists canonical owner for the handoff record class in CONTRACTS.md (B-06).
- [ ] Align baseline fields with F05.S02.M02 return and F05.S02.M03 damage.
- [ ] Validate `RNTHAND.*` codes against the CTR-ERR-001 registry.
- [ ] Complete Prompt 3 specification-quality review before implementation.
