# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) (PS-014-01)
  - [x] Slot fields and `acc_` authorization-only rule written
  - [x] Producers and consumers mapped (F02.S01.M01, F02.S01.M03, F02.S02.M04)
- [x] [validation_rules.md](validation_rules.md) (PS-014-02)
  - [x] Pseudonym-active and K_MIN checks defined
- [x] [workflow_state_machine.md](workflow_state_machine.md) (PS-014-03)
  - [x] Accept vs expiry race and cycle-fully-accepted rule
- [x] [commands_queries_events.md](commands_queries_events.md) (PS-014-04)
  - [x] Invitee resolved from `prf_`; `acc_` not sent to proposer
- [x] [authorization_capabilities.md](authorization_capabilities.md) (PS-014-05)
  - [x] Case-scoped removal and `acc_` visibility rule
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-014-06)
  - [x] Atomic multi-slot invite and fixed lock order
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-014-07)
  - [x] Sybil caps and counterparty visibility end on close
- [x] [observability_performance.md](observability_performance.md) (PS-014-08)
  - [x] No identity labels in metrics
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-014-09)
  - [x] Two- and six-party end-to-end fixtures named
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-014-10)
  - [x] No MVP import; export redacts counterparties

**Receipts:** not applicable; this module moves no money and produces no receipts.
