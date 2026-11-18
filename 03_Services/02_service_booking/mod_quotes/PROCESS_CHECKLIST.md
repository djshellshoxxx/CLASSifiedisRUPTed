# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — `svq_` record; `qte_` not reused
  - [ ] Register `svq` prefix with CTR-ID-001 owner
- [x] [validation_rules.md](validation_rules.md) — SVCQUOTE.* codes; exact line-item sum
  - [ ] Confirm 14-day maximum validity with F03 owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — hold on send; atomic accept
  - [ ] Confirm hold release on decline, withdraw and expiry with F03.S01.M02 owner
- [x] [commands_queries_events.md](commands_queries_events.md) — six commands, seven events
  - [ ] Confirm `svcquote.accepted` consumers (F09, F03.S01.M02) with their owners
- [x] [authorization_capabilities.md](authorization_capabilities.md) — provider self-scope; customer accept
  - [ ] Confirm public "from" price band rule with F03 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — outbox; duplicate accept returns same trx
  - [ ] Confirm F09 timeout and retry schedule with F09 owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — scope purge 30 days; quote retention 90 days
  - [ ] Confirm off-platform contact flag with F12 owner
- [x] [observability_performance.md](observability_performance.md) — no prices in logs; partial-accept alert
  - [ ] Confirm accept budgets after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — single and three-window flows
  - [ ] Confirm fixture data is synthetic with privacy lead
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — export only; hash retained
  - [ ] Confirm export size limit with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: F03.S02.M01 owns service quotes; F09 owns `trx_` and claims; F09.S03 owns `qte_`.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D04, D06).
- [ ] Complete specification-quality review before implementation.
