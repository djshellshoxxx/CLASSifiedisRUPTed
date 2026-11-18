# Process inventory and integration checklist — mod_recovery (cycle compensation)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-024-01: recovery record, per-party attestation, compensation plan.
- [x] [validation_rules.md](validation_rules.md) — PS-024-02: attestation window, signature check, no-handover-claim wording.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-024-03: open, awaiting, compensating, closed, escalated.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-024-04: open, attest, compensate, escalate.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-024-05: participant attest; moderator sees case only.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-024-06: partial attestations, window expiry, plan replay.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-024-07: evidence minimisation, RET-EVD 24 months.
- [x] [observability_performance.md](observability_performance.md) — PS-024-08: open-to-closed time, escalation rate.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-024-09: dropout, partial, and disagreement e2e tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-024-10: attestation bytes preserved, no lossy migration.

## Integration gates
- [ ] Attestation format agreed with F09 (CTR-COM-001 R14).
- [ ] Escalation contract agreed with F12 (PENDING).
- [ ] Record unresolved choices in DECISIONS.md (D04, D06 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
