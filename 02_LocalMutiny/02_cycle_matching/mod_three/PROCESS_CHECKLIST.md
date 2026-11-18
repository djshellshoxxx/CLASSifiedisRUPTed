# Process inventory and integration checklist — mod_three

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-020-01: three slots, canonical rotation, listing-lock reference.
- [x] [validation_rules.md](validation_rules.md) — PS-020-02: length 3, distinct participants and listings, no locked listing.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-020-03: decline releases all three; no partial lock.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-020-04: propose, consent, decline with expected version.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-020-05: three participants only.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-020-06: two-of-three consent then decline; version races.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-020-07: pseudonymous slots, relevance not used for eligibility.
- [x] [observability_performance.md](observability_performance.md) — PS-020-08: proposal-to-lock funnel for three-party cycles.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-020-09: three-party e2e and listing-lock tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-020-10: versioned replay, participant export.

## Integration gates
- [ ] Rotation fixtures shared with mod_four.
- [ ] Relevance-ordering contract agreed with F06 (PENDING).
- [ ] Record unresolved choices in DECISIONS.md (D02 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
