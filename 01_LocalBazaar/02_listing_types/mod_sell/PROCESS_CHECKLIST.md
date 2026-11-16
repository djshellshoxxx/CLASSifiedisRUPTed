# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-006-01
  - [x] Sell price, currency and quantity typed per CTR-COM-001 R02–R03
  - [x] Every field carries one data class (CTR-PRV-001 R01)
  - [ ] `prq` prefix registered in CTR-ID-001 (PENDING)
- [x] [validation_rules.md](validation_rules.md) — PS-006-02
  - [x] Every rejection maps to one `SELL.*` code with fixed category and retryable value
  - [x] Price and location errors echo no submitted value
  - [x] `SELL.TERMS_LOCKED` maps to HTTP 412 per CTR-ERR-001
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-006-03
  - [x] Rows T1–T10 cover reservation, sale, dispute hold and reversal
  - [x] Sale recorded only on COUNTERPARTY_ATTESTED (cash, other_external) or EXTERNALLY_VERIFIED or FINAL (on-chain)
  - [x] Self-submitted claim leaves `sell_state` unchanged
  - [ ] F09 transaction event for `trx_` create and cancel (PENDING CTR-COM-001)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-006-04
  - [x] Five commands versioned v1 with idempotency keys
  - [x] Request and sale events marked non-federable
  - [ ] CTR-SCH-001 registry entries for sell events (PENDING)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-006-05
  - [x] `sys_` writes limited to `sell_state`, `quantity_remaining`, `reservation`
  - [x] Operators have no read path to `prq_`
  - [ ] F12 account-suspension flag confirmed (ASSUMPTION)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-006-06
  - [x] Two-phase reservation with `trx_` compensation
  - [x] Offline accept and decline disabled on client and server
  - [ ] 15-minute reconciliation interval agreed with F09 owner (ASSUMPTION)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-006-07
  - [x] Buyer identity visible only to listing owner and buyer
  - [x] No sell or request event federated
  - [ ] F10 review of 90-day request retention (PROVISIONAL, D07)
  - [ ] F12 review of request limit and reservation cap (ASSUMPTION)
- [x] [observability_performance.md](observability_performance.md) — PS-006-08
  - [x] Metric labels contain no IDs or free text
  - [ ] Reference load profile defined by F17 (ASSUMPTION)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-006-09
  - [x] Every `SELL.*` code has a fixture and a test
  - [ ] Recorded F09 sandbox run before release (ASSUMPTION)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-006-10
  - [x] Owner and buyer export scopes defined
  - [x] Rollback via `sell_listing_type` flag leaves no reservation without `trx_` or compensation
  - [ ] Golden fixture for `sell.listing-extension` 1.0.0 created at implementation

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (F09 transaction event; F01.S01 boundary).
- [x] Validate typed errors, capabilities, events and schema versioning in the specs.
- [x] Cover rollback, backup/restore, import/export and retention in the specs.
- [ ] Record unresolved choices in DECISIONS.md (D01, D03, D05, D06, D07, D08, D10 remain OPEN).
- [ ] Complete Prompt 3 specification-quality review before implementation.
