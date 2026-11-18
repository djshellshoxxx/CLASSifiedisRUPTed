# F02.S04.M01 — mixed

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F02). **Parent:** F02.S04.

## Purpose and business behavior
Lets barter participants in a LocalMutiny proposal or cycle close a value gap with explicit compensation legs: cash, bank transfer, on-chain transfer, external card, in-kind, or other external. The party that owes compensation declares a leg with an integer minor-unit amount, a pinned quote where currencies differ, and a valuation snapshot from F02.S04.M03. Each leg becomes a `clm_` claim under CTR-COM-001 when submitted. The platform records declarations, consents and attestations only. It never holds, moves or verifies compensation funds.

## User stories
- As a proposer, I declare a compensation leg for my slot and see the exact gap it closes, the amount in minor units and the quote used.
- As a receiving party, I attest or dispute a leg without seeing the payer's bank reference or wallet address.
- As a participant, I see each leg as claimed or attested, never as paid.

## Scope
- Owns: compensation leg records inside `cyc_` revisions; leg lifecycle; declare, withdraw and submit-claim commands.
- Consumes: valuation snapshot (`02_LocalMutiny/04_value_balancing/mod_valuation`), currency registry (F09.S03.M01), claim records (`clm_`, F09, CTR-COM-001).
- Out of scope: quote issuance, rounding rules, claim verification, dispute resolution (F09), federation of financial evidence (deferred per CTR-COM-001).

## Public interfaces
Commands `mixed.leg.declare`, `mixed.leg.withdraw`, `mixed.leg.submit_claim`, `mixed.leg.attest`; query `mixed.leg.list`; events `mixed.leg.*`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F02.S04.M03 `mod_valuation` (snapshot hash and gap), F09.S03.M01 `mod_currency` (registry). Downstream: F09.S02.M02 disputes, F13 notifications, F12 signals (advisory counts only). Contracts: CTR-COM-001, CTR-SCH-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

## Data ownership
This module owns leg rows inside cycle revisions only. Canonical owner of claim and settlement records: F09 (`clm_`, CTR-COM-001). Canonical owner of valuation snapshots: F02.S04.M03. Canonical owner of pinned quotes (`qte_`): F09.S03. Consumers reference these by full ID.

## Risk considerations
- Declared compensation that is never paid: no platform escrow; mitigated by attestation timers and explicit `UNATTESTED` state (PROVISIONAL D04 default).
- Gap manipulation through inflated valuations (owned by mod_valuation; signal to F12).
- Payment-handle leakage through legs or logs.
- Edits after consent that change terms silently (prevented by revision reset).
- Laundering value through compensation legs between colluding participants.
- Currency and rounding mismatch between leg and snapshot.

## Completion criteria
All ten process specs (PS-026-01 to PS-026-10) are SPEC-DRAFT-COMPLETE; the leg state machine matches CTR-COM-001 claim states; every MIXED error code is registered; implementation, tests and security review are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-026-01
- [x] [validation_rules.md](validation_rules.md) — PS-026-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-026-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-026-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-026-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-026-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-026-07
- [x] [observability_performance.md](observability_performance.md) — PS-026-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-026-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-026-10
