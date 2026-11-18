# F09.S03.M01 — currency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S03 valuation](../SPEC.md). **Canonical owner for currency registry and valuation records:** this module (PROVISIONAL, per REVIEW_2026-11-16 B-06 fix; consumers reference by full ID). **Canonical contracts:** CTR-COM-001 (currency object R02–R03), CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Purpose and business behavior
Canonical registry of the currencies ClassRup can price and settle in: fiat (ISO 4217 alpha-3, minor-unit exponent) and assets (CAIP-19 identifiers, exponent from the chain adapter). Every amount in the commerce path refers to a registry entry. The module owns entry definitions, status and versions. It does not fetch rates (mod_rates) or do arithmetic (mod_precision).

## User stories
- As a participant, I see the currency name, symbol and decimal places of every amount in a proposal.
- As an operator, I can disable an asset without changing claims that already reference it.
- As a consumer module, I rely on one exponent per currency, so amounts are not scaled differently in two places.

## Scope
- In scope: fiat and asset registry entries, exponent, display metadata, status (`enabled`, `disabled`, `deprecated`), version history.
- Out of scope: exchange rates (mod_rates), arithmetic and rounding (mod_precision), chain adapters (mod_crypto), LocalMutiny value balancing (consumer, F02 S04).

## Public interfaces
Commands `currency.register`, `currency.set_status`. Queries `currency.get`, `currency.list`. Events `currency.registered`, `currency.status_changed`. Prefix `cur_` is PENDING CTR-ID-001 registration.

## Relationships, dependencies and integration
Upstream: ISO 4217 code list (maintained externally; updates via reviewed change), CAIP-19 identifiers from chain adapters (mod_crypto). Downstream: mod_rates, mod_precision, mod_cash, mod_crypto, mod_receipts, LocalMutiny `mod_currency` (02_LocalMutiny/04_value_balancing/mod_currency), `mod_offers` and proposal flows. The duplicate slug in LocalMutiny is a consumer only.

## Data ownership
Owns `cur_` (PENDING prefix) registry entries and their version history. Does not own claims (CTR-COM-001), quotes (`qte_`, mod_rates) or evidence.

## Risk considerations
Wrong exponent scales amounts by a factor of 10^k; look-alike asset identifiers (same symbol, different contract); disabling a currency that open claims depend on; registry drift between modules; schema changes breaking signed evidence.

## Completion criteria
Exponent table reviewed against the ISO 4217 list; asset onboarding checklist approved; version history immutable; cross-module consumer list confirmed in planning/CONTRACTS.md (lead action).

## Required process specification inventory
- [x] `domain_schema.md` — PS-073-01
- [x] `validation_rules.md` — PS-073-02
- [x] `workflow_state_machine.md` — PS-073-03
- [x] `commands_queries_events.md` — PS-073-04
- [x] `authorization_capabilities.md` — PS-073-05
- [x] `failure_recovery_idempotency.md` — PS-073-06
- [x] `privacy_retention_abuse.md` — PS-073-07
- [x] `observability_performance.md` — PS-073-08
- [x] `contract_and_acceptance_tests.md` — PS-073-09
- [x] `import_export_backup_rollback.md` — PS-073-10
