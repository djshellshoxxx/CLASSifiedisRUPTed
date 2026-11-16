# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md) (Marketplace Lead). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-008-01 specified
  - [x] Unit counters and derived `available_units` defined (R02, R03)
  - [ ] Register `avl` and `hld` in CTR-ID-001
  - [ ] F10 confirms `holder_ref` class PSEUDONYMOUS
- [x] [validation_rules.md](validation_rules.md) — PS-008-02 specified
  - [x] Rules V01–V13 and `AVAIL.*` codes mapped to CTR-ERR-001
  - [ ] F15 confirms `AVAIL` module slug against CTR-ERR-001 R02
  - [ ] Hold limits (50 per listing, 3 per holder) reviewed by Trust and Safety
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-008-03 specified
  - [x] Execute-versus-expire race defined
  - [ ] Archive-cascade test scheduled with F01.S01.M04
  - [ ] D04 decision recorded for execution semantics
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-008-04 specified
  - [x] Owner and sys command signatures with `expected_revision`
  - [ ] Event schemas registered in CTR-SCH-001
  - [ ] `offer_ref` prefix confirmed with F01.S04.M01
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-008-05 specified
  - [x] Holder refs restricted to proposal parties
  - [ ] `hold.create` scope for F02.S03.M02 added to CTR-CAP-001
  - [ ] Moderation pause grant (≤ 72 h) wired to F12 case flow
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-008-06 specified
  - [x] Last-unit race and offer-hold saga defined
  - [ ] D08 decision recorded for offline holds
  - [ ] Fault-injection plan for orphan holds scheduled
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-008-07 specified
  - [x] Holds excluded from federation
  - [ ] F10 review of count disclosure on private listings (OPEN)
  - [ ] D07 retention defaults approved or changed
- [x] [observability_performance.md](observability_performance.md) — PS-008-08 specified
  - [x] Invariant-violation metric and paging alert defined
  - [ ] Load test at 200 `hold.place`/s planned
  - [ ] F15 confirms telemetry sinks and RET-OPS log retention
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-008-09 specified
  - [x] Consumer contract list for offers, archive, variants, cycle lock
  - [ ] Two-buyer race e2e test built
  - [ ] F02.S03.M02 contract entry exists before TEST-PS-008-09-04 runs
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-008-10 specified
  - [x] Restore order and compensating rollback defined
  - [ ] F15 RTO and RPO values provided
  - [ ] Restore drill scheduled

## Integration gates
- [ ] Record canonical owner for "listing unit availability" (F01.S03.M01) in planning/CONTRACTS.md (B-06).
- [ ] Resolve `avl`, `hld`, `variant_ref`, `offer_ref` prefixes in CTR-ID-001.
- [ ] Validate `AVAIL.*` codes and `hold.create` capability with F15 and F16.
- [ ] Cover rollback, backup/restore and compensating reversal in tests.
- [ ] Record unresolved choices (D04, D07, D08) in DECISIONS.md as OPEN.
- [ ] Complete Prompt 3 specification-quality review before implementation.
