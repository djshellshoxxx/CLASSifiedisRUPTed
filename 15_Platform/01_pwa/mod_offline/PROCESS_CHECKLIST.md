# Process inventory and integration checklist — F15.S01.M01 offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Platform Lead, F15). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-116-01: entry fields, 500-entry and 5 MiB caps, payload digest.
- [x] [validation_rules.md](validation_rules.md) — PS-116-02: enqueue and replay validation, `OFFLINE.*` codes.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-116-03: six states, applied only on server ack.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-116-04: enqueue, replay, discard, retry, list.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-116-05: `offline_entry.*` self-scope; server re-authorizes at commit.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-116-06: 15 s timeout, 50 attempts, 30-day expiry.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-116-07: ciphertext at rest, purge on ack, account-switch prompt.
- [x] [observability_performance.md](observability_performance.md) — PS-116-08: label enums, replay latency, reference device budgets.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-116-09: owner contract tests, airplane-mode e2e.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-116-10: queue excluded from export and backup, upcast on read.

## Integration gates (not yet done)
- [ ] Owner modules F01.S03.M01, F03.S01.M02, F05.S01.M01 confirm offline-capable commands.
- [ ] D08 and D10 recorded in DECISIONS.md with status.
- [ ] CTR-SCH-001 payload snapshot delivery confirmed by F15.
