# Process inventory and integration checklist — mod_authorization

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Security Lead). See [registry](../../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-126-01: grant schema referenced from CTR-CAP-001; policy and cache tables added.
- [x] [validation_rules.md](validation_rules.md) — PS-126-02: expiry ≤ 72 h, purpose registry, case_id for case scope.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-126-03: grant active/revoked/expired; policy draft/published/superseded.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-126-04: grant and policy commands; grant.* and policy.* events.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-126-05: authz-owned capabilities and CTR-CAP-001 matrix rows.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-126-06: fail-closed, revocation-before-decision rule.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-126-07: no content in decision records; RET-AUD; DENY threshold alert.
- [x] [observability_performance.md](observability_performance.md) — PS-126-08: decision p95 ≤ 5 ms; revocation lag ≤ 60 s.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-126-09: S3-02 negative suite and matrix tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-126-10: policy bundle, policy rollback, vocabulary migration.

## Module-specific integration gates
- [ ] Cross-check decision record fields against CTR-CAP-001 decision record schema.
- [ ] Cross-check `grant.*` events against CTR-FED-001 peer revocation events.
- [ ] Confirm every module authorization matrix references CTR-CAP-001 action vocabulary.
- [ ] Confirm purpose registry owner with Privacy Lead (F10).
