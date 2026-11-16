# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: Marketplace Lead (F01), see [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-010-01 written
- [x] Negotiation record fields, `neg_`, `lst_` snapshot, `acc_` seller and initiator defined
- [x] No free-text, location, contact or account/wallet field (PS-010-01 R04, R05)
- [ ] Map `lst_` listing version and F07 `prf_` view to upstream owners (F01, F07)
- [ ] Register `neg` prefix in CTR-ID-001 (PENDING)
- [x] [validation_rules.md](validation_rules.md) — PS-010-02 written
- [x] Ratio bounds, round cap, listing-edit accept block, self-negotiation block defined
- [x] Error table covers all `NEG.*` codes with retryable and HTTP status
- [ ] Confirm `NEG.TERMS_OUT_OF_BOUNDS` bounds with commerce review (ASSUMPTION)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-010-03 written
- [x] Turn rule, 72 h window, 14-day lifetime, six states, transition table
- [x] AGREED creates no `trx_` record
- [ ] Confirm F09 handoff trigger for AGREED (separate command, outside module)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-010-04 written
- [x] Seven event types with `negotiation.*` names and idempotency scope
- [ ] Register seven event schemas and `negotiation.export` in CTR-SCH-001 (PENDING)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-010-05 written
- [x] Seller view omits initiator `acc_`; other buyers invisible (`SYS.NOT_FOUND`)
- [ ] Confirm `case`-scope purpose values with F16 (OPEN)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-010-06 written
- [x] Unique partial index on active (listing, initiator) pair
- [x] Accept-vs-expiry, accept-vs-listing-edit and offline replay outcomes defined
- [ ] Load-test unique-pair constraint under concurrent opens
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-010-07 written
- [x] Retention for agreed and non-agreed negotiations; push previews generic
- [ ] F10 review of PSEUDONYMOUS classing for negotiated terms
- [x] [observability_performance.md](observability_performance.md) — PS-010-08 written
- [x] Latency budgets, must-be-zero alerts, closed metric label sets
- [ ] Set K=5 suppression with F10 for listing-level dashboards
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-010-09 written
- [x] Property invariants for terminal states, revisions, round cap and turn rule
- [ ] Build PS-010 to TEST-PS-010 traceability table
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-010-10 written
- [x] Owner export, no import path, flag-off freeze, correction-by-event rule
- [ ] Align RPO 15 min and RTO 4 h with F15 backup policy (ASSUMPTION)

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (listing F01, identity F07, trade F09, consent owner per B-06).
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001 and CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D04, D05, D07, D08, D10 referenced; none approved).
- [ ] Complete Prompt 3 specification-quality review before implementation.
