# Process inventory and integration checklist — F16.S02.M01 key

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Security Lead, F16). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-128-01: public-only fields, fingerprint uniqueness, 730-day validity.
- [x] [validation_rules.md](validation_rules.md) — PS-128-02: 32-byte keys, private-material refusal, purpose and algorithm pairing.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-128-03: pending proof, 30-day rotation overlap, terminal revocation.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-128-04: register, prove, rotate, revoke, public reads.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-128-05: owner-only writes, two approvers on compromise revoke.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-128-06: durable revocation, 24-hour snapshot freshness.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-128-07: no platform-held user private keys; one key per purpose.
- [x] [observability_performance.md](observability_performance.md) — PS-128-08: revocation burst and snapshot staleness alerts.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-128-09: five consumer contracts, library vectors.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-128-10: public-only owner export, revocations survive restore.

## Integration gates (not yet done)
- [ ] D10 recorded in DECISIONS.md.
- [ ] F16 cryptographic review of Ed25519 and X25519 choice.
- [ ] Recovery hand-off with F07 agreed.
