# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-091-01 specified; trust rows and `trs_` mapped to CTR-PRV-001 classes
- [x] [validation_rules.md](validation_rules.md) — PS-091-02 specified; error registry `TRUST.*` mapped to CTR-ERR-001
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-091-03 specified; five peer states from CTR-FED-001
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-091-04 specified; `peer.*` events on CTR-EVT-001 envelope
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-091-05 specified; dual control for admit, restore, revoke
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-091-06 specified; revision drift reconciliation
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-091-07 specified; equivocation evidence retention, Sybil admission cap
- [x] [observability_performance.md](observability_performance.md) — PS-091-08 specified; metrics carry no peer labels
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-091-09 specified; two-node federation suite
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-091-10 specified; no trusted import, no rollback command

## Integration gates
- [ ] Map upstream F07.S03.M01 and F16.S02.M03 signals to trust inputs with owners.
- [ ] Map downstream F11.S03.M02 and relay sync consumers to `peer.*` events.
- [ ] Validate CTR-FED-001 peer states and CTR-CAP-001 capability IDs with owners.
- [ ] Record D01, D07, D08 (N/A for trust commands), D10 status in DECISIONS.md (PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
