# Process inventory and integration checklist — F02.S03.M01 mod_consent

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — cycle_consent columns and consent_record_ref to F10.S01.M01
- [x] [validation_rules.md](validation_rules.md) — snapshot hash and expiry checks
- [x] [workflow_state_machine.md](workflow_state_machine.md) — CONSENTING to CONSENTED or NOT_CONSENTED
- [x] [commands_queries_events.md](commands_queries_events.md) — cyc.consent and cycle.consented contracts
- [x] [authorization_capabilities.md](authorization_capabilities.md) — participant-only, operators denied
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — revision race and offline pending queue
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — no location or free text; 90-day retention
- [x] [observability_performance.md](observability_performance.md) — label cardinality and 300 ms p95
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — 2/3/4-party scenarios
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — own-rows export; no federated consent in MVP

## Integration gates
- [ ] Resolve cycle size bound (D02) with F02.S02 owner.
- [ ] Confirm F10.S01.M01 accepts consent_record_ref contract.
- [ ] Validate typed errors CYC_CONSENT.* against CTR-ERR-001.
- [ ] Record D07 retention and D08 offline defaults in DECISIONS.md review.
