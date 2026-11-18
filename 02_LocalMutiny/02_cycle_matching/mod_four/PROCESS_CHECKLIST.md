# Process inventory and integration checklist — mod_four

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-017-01: four slots, canonical rotation, version counter.
- [x] [validation_rules.md](validation_rules.md) — PS-017-02: length exactly 4, distinct participants and listings, FEASIBLE-only input.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-017-03: proposed, consented, locked, declined, expired, superseded.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-017-04: propose, consent and decline with expected version.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-017-05: participant-only consent and view.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-017-06: version-bound consent, timeouts, duplicate consent replay.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-017-07: slot view limits, proposal-flood cap.
- [x] [observability_performance.md](observability_performance.md) — PS-017-08: proposal-to-lock funnel, consent latency.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-017-09: four-party e2e and version-supersession tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-017-10: versioned replay, disable without touching other cycle lengths.

## Integration gates
- [ ] Rotation and tie-break fixtures signed off with mod_n.
- [ ] Event names and CYCFOUR codes registered (PENDING CTR-EVT-001, CTR-ERR-001).
- [ ] Record unresolved choices in DECISIONS.md (D02 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
