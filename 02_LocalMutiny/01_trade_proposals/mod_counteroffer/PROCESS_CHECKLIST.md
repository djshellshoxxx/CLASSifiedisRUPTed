# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-012-01 drafted
  - [x] Requirements R01–R06 cover one row per revision, single OPEN rule, money format, no location
  - [x] Upstream `cyc_` owner and downstream readers mapped; `cof_` prefix PENDING CTR-ID-001
  - [ ] Privacy review of `value_terms` classification (F10)
  - [x] Fixtures named in PS-012-09 (TEST-PS-012-09-04, -05)
- [x] [validation_rules.md](validation_rules.md) — PS-012-02 drafted
  - [x] Ordered checks and `CTROFFER.*` codes mapped to CTR-ERR-001 categories
  - [x] Shared codes reused (`EVT.REVISION_CONFLICT`, `COM.QUOTE_EXPIRED`, `SYS.RATE_LIMITED`)
  - [ ] Limit values (5 revisions, 10 creates per 24 h) reviewed by F16
  - [x] Fixtures named (TEST-PS-012-09-01)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-012-03 drafted
  - [x] Seven states and transition table with guards and side effects
  - [ ] Accept semantics reviewed under D04 (Marketplace Lead)
  - [x] Fixtures named (TEST-PS-012-09-04, -08)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-012-04 drafted
  - [x] Commands, queries and `counter.*` events with payload classes
  - [ ] Event registry entries pending CTR-EVT-001
  - [x] Fixtures named (TEST-PS-012-09-02)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-012-05 drafted
  - [x] Actor × action matrix for holders, non-participants, `mod_`, `ope_`, `sys_`
  - [ ] Block control owner confirmed (F12)
  - [x] Fixtures named (TEST-PS-012-09-03)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-012-06 drafted
  - [x] Accept/supersede race, outbox, offline pending queue (D08) defined
  - [ ] Cycle write transaction owner confirmed (F02)
  - [x] Fixtures named (TEST-PS-012-09-07, -08)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-012-07 drafted
  - [x] Retention table, tombstone rule, linkage controls (D05, D07)
  - [ ] Privacy Lead review of timestamp coarsening (F10)
  - [ ] Security Lead review of abuse thresholds (F16)
- [x] [observability_performance.md](observability_performance.md) — PS-012-08 drafted
  - [x] Metrics, log redaction, p95 budgets (ASSUMPTION)
  - [ ] Alert routing confirmed with F15
  - [x] Fixtures named (TEST-PS-012-09-09 scope)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-012-09 drafted
  - [x] TEST-PS-012-09-01 to -10 mapped to CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-COM-001
  - [ ] QA Lead (F17) assigns test environment
  - [x] Synthetic fixtures defined (ASSUMPTION)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-012-10 drafted
  - [x] Export format, restore invariants, feature-flag rollback
  - [ ] Backup owner for `cyc_` confirmed (F02/F15)
  - [x] Federation deferred (PS-012-10 R04)

## Integration gates
- [ ] Resolve owner of `cyc_` aggregate and its revision write (F02).
- [ ] Register `cof_` prefix and `counter.*` event types in CTR-ID-001 and CTR-EVT-001 (PENDING).
- [ ] Confirm value-term references use CTR-COM-001 quote and claim IDs only; no settlement state is set here (CTR-COM-001.R05, R07).
- [ ] Record open choices in DECISIONS.md (D02, D03, D04, D05, D07, D08 as referenced).
- [ ] Complete Prompt 3 specification-quality review before implementation.
