# Process inventory and integration checklist — mod_currency (cycle currency terms)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-025-01: quote reference binding, presentation fields, no rate stored.
- [x] [validation_rules.md](validation_rules.md) — PS-025-02: quote expiry gate, exponent match, label rules.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-025-03: unbound, bound, expired, refreshed states.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-025-04: pin reference at consent, value terms read.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-025-05: participant read; system pin only.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-025-06: quote refresh, no silent re-pin, rounding replay.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-025-07: amounts per participant, no location-based pricing.
- [x] [observability_performance.md](observability_performance.md) — PS-025-08: quote-block rate, label-check failures.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-025-09: expiry, rounding and label tests.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-025-10: quote-hash preservation, rollback to unpriced terms.

## Payment and receipt checks (money-related module)
- [x] No platform balance, custody or payout field (CTR-COM-001 R01; COM.CUSTODY_FORBIDDEN).
- [x] Amounts are integer minor units as decimal strings; no floats (CTR-COM-001 R02).
- [x] Labels below FINAL exclude "paid", "payment received" and "settled" (CTR-COM-001 R15).
- [x] Receipts are signed statements only, verified separately (D06, PROVISIONAL).

## Integration gates
- [ ] Lead decision on rename or merge of mod_currency.
- [ ] F09 confirms quote ownership and fields (PENDING).
- [ ] Record unresolved choices in DECISIONS.md (D03, D06 referenced; PROVISIONAL).
- [ ] Complete Prompt 3 specification-quality review before implementation.
