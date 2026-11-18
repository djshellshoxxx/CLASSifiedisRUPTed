# F09.S01.M02 — cash

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S01 payments](../SPEC.md). **Canonical contracts:** CTR-COM-001 (claim, states, errors), CTR-EVT-001, CTR-CAP-001, CTR-PRV-001, CTR-ID-001, CTR-SCH-001, CTR-ERR-001. **Decisions:** D03, D04, D06, D08, D09 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
Cash method profile for payment claims. Parties record a cash handover as a `clm_` claim with `method = cash`, and the counterparty may attest it. The platform never verifies cash, never holds cash or balances, and never moves a cash claim past `COUNTERPARTY_ATTESTED` (CTR-COM-001 R07). The module configures where and in which currencies cash claims are offered, sets ceilings, and defines the labels and copy shown for cash.

## User stories
- As a participant, I record that I paid or received cash, so my counterparty can attest or dispute it.
- As a participant, I see clearly that a cash claim is an assertion and not a verified payment.
- As an operator, I can disable the cash method for a currency or region without touching existing claims.

## Scope
- In scope: cash method enable/disable, per-currency ceiling, cash-specific copy and labels, attest-only rule, cash-specific validation profile.
- Out of scope: claim schema and state machine (CTR-COM-001), disputes (F09 mod_disputes), on-chain transfers (mod_crypto), receipts (mod_receipts), reconciliation (mod_reconciliation).

## Public interfaces
Command `cash_method.configure` (operator, dual control for changes to ceilings). Events `cash_method.enabled`, `cash_method.disabled`, `cash_method.ceiling_changed`. Claim commands from CTR-COM-001 (`clm.submit`, `clm.attest`, `clm.dispute`).

## Relationships, dependencies and integration
Upstream: `trx_` transaction (F09), `cur_` (PENDING prefix) currency registry (09 mod_currency), `qte_` quotes for cross-currency cash (mod_rates). Downstream: notifications (F13), evidence (mod_receipts), reconciliation (mod_reconciliation).

## Data ownership
Owns cash method configuration only. Claim records belong to CTR-COM-001 (canonical owner F09 Commerce). Consumers reference `clm_` by full ID.

## Risk considerations
Fabricated cash claims; collusive attestation between two parties; unverifiable handover; claim-as-payment confusion in UI; cash in mixed-value barter mistaken for money; coercion. A cash claim proves an assertion, not payment or handover.

## Completion criteria
Process specs drafted; CTR-COM-001 ceiling rule confirmed; F10 review of handover-place data (none stored beyond venue class); F14 review of cash labels; no implementation before approval.

## Required process specification inventory
- [x] `domain_schema.md` — PS-067-01
- [x] `validation_rules.md` — PS-067-02
- [x] `workflow_state_machine.md` — PS-067-03
- [x] `commands_queries_events.md` — PS-067-04
- [x] `authorization_capabilities.md` — PS-067-05
- [x] `failure_recovery_idempotency.md` — PS-067-06
- [x] `privacy_retention_abuse.md` — PS-067-07
- [x] `observability_performance.md` — PS-067-08
- [x] `contract_and_acceptance_tests.md` — PS-067-09
- [x] `import_export_backup_rollback.md` — PS-067-10
