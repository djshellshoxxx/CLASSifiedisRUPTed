# F02.S04.M02 — mod_currency (cycle currency terms, consumer)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S04 (value_balancing). **Canonical record owner:** none for quotes or rates. Pinned quotes (`qte_`) are owned by F09.S03.M01 `09_Commerce/03_valuation/mod_currency`; rates by F09.S03.M02; precision and exponents by F09.S03.M03. This module is a consumer only (B-06 and the review fix: rename or merge pending lead decision).

## Purpose and business behavior
When a barter cycle includes offers priced in different currencies (fiat or asset), shows the cycle's value terms using a quote pinned by the valuation owner, and blocks consent when that quote is missing or expired. It never computes its own rate, never converts with floats, and never labels any state below FINAL as paid or settled. Its job is presentation and gating of cycle terms, not valuation.

## User stories
- As a participant, I see the value of each side in its own currency and the reference currency used to compare them, with the quote's expiry time.
- As a participant, if the quote expires before I consent, I am told to refresh the terms, not shown a stale figure.
- As an operator, I can see how often cycles are blocked by quote problems, without seeing amounts per user.

## Scope
Ten process specifications (inventory below). Mixed-value compensation logic belongs to F02.S04.M01 (mod_mixed).

## Public interfaces
Query: `cycle.value_terms_get` (participant). Command: `cycle.pin_quote_ref` (system, binds a `qte_` to a cycle version at consent). Events: `cycle.value_terms_bound`. Error module code `CYCCURR`.

## Relationships, dependencies and integration
Upstream: F09.S03.M01 (valuation owner; quotes via CTR-COM-001 R04), F09.S03.M02 (rates), F09.S03.M03 (exponents and precision), F02.S04.M03 (mod_valuation, cycle-level gap). Downstream: F02.S02.M05 (feasibility uses bound quote reference), F02.S03.M02 (mod_lock checks quote validity). Shared contracts: CTR-COM-001, CTR-SCH-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

## Data ownership
Owns only the cycle-to-quote binding and the presentation record. Does not own quotes, rates, currency registry entries, receipts or payment state.

## Risk considerations
Stale quotes presented as current, floating-point rounding that shifts value between parties, labels implying payment, currency confusion between fiat and asset, and linkage of valuation to location. Pseudonyms do not guarantee anonymity. No platform custody of money.

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; F09.S03.M01 ownership confirmed in writing; rename or merge decision recorded; label catalog reviewed for "paid" and "settled" terms.

## Required process specification inventory
- [x] `domain_schema.md` — PS-025-01
- [x] `validation_rules.md` — PS-025-02
- [x] `workflow_state_machine.md` — PS-025-03
- [x] `commands_queries_events.md` — PS-025-04
- [x] `authorization_capabilities.md` — PS-025-05
- [x] `failure_recovery_idempotency.md` — PS-025-06
- [x] `privacy_retention_abuse.md` — PS-025-07
- [x] `observability_performance.md` — PS-025-08
- [x] `contract_and_acceptance_tests.md` — PS-025-09
- [x] `import_export_backup_rollback.md` — PS-025-10
