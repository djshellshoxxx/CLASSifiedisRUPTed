# F08.S02.M01 — offers

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** [F08.S02](../SPEC.md).

## Purpose and business behavior
Non-binding negotiation offers (`ofr_`) between two parties about a listing or a cycle slot: price in integer minor units, compensation lines for mixed-value barter (valued in a pinned reference currency), counter-offers as new versions, and expiry. An accepted offer is binding only after the matching consent record is given ([F08.S02.M02 consent](../mod_consent/SPEC.md)). No platform custody; no payment is made or confirmed here (CTR-COM-001).

## User stories
- As a buyer, I make a price offer with an expiry, and I see when it lapses.
- As a barterer, I add item and service compensation with a value shown in one reference currency.
- As a recipient, I counter, accept or decline, and I know that an accepted offer still needs my consent to bind.
- As an operator, I cannot read offer amounts without a case grant and dual control.

## Scope
- Required process spec: [PS-063-01 domain schema](domain_schema.md)
- Required process spec: [PS-063-02 validation rules](validation_rules.md)
- Required process spec: [PS-063-03 workflow state machine](workflow_state_machine.md)
- Required process spec: [PS-063-04 commands queries events](commands_queries_events.md)
- Required process spec: [PS-063-05 authorization capabilities](authorization_capabilities.md)
- Required process spec: [PS-063-06 failure recovery idempotency](failure_recovery_idempotency.md)
- Required process spec: [PS-063-07 privacy retention abuse](privacy_retention_abuse.md)
- Required process spec: [PS-063-08 observability performance](observability_performance.md)
- Required process spec: [PS-063-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- Required process spec: [PS-063-10 import export backup rollback](import_export_backup_rollback.md)

## Public interfaces
Commands `ofr.create`, `ofr.counter`, `ofr.accept`, `ofr.decline`, `ofr.withdraw`; query `ofr.list`; events `offer.*`. Money per CTR-COM-001 R02–R03. Detail in PS-063-04.

## Relationships, dependencies and integration
Upstream: listings [F01.S04.M01 pricing](../../../01_LocalBazaar/04_pricing/mod_offers/SPEC.md) and [F02.S01.M03 trade offers](../../../02_LocalMutiny/01_trade_proposals/mod_offer/SPEC.md) reference `ofr_` by full ID; identity (F07); quotes (CTR-COM-001). Downstream: consent ([F08.S02.M02](../mod_consent/SPEC.md)), threads for discussion ([F08.S01.M02](../../01_messaging/mod_threads/SPEC.md)) by reference only, notifications (F13). Integration: contract tests for `offer.accepted` → consent request.

## Data ownership
Canonical owner of the `ofr_` record class (B-06, PROVISIONAL). Pricing and proposal modules hold their own records and reference `ofr_` by full ID.

## Risk considerations
- Amount leakage through notifications, logs and counts.
- Lowball or spam offers and probing of listing availability.
- Binding confusion: accepted offer read as payment or agreement without consent.
- Floating-point or leading-zero money values corrupting totals.
- Accept racing expiry or counter on offline clients.
No platform custody; offers are not payment evidence.

## Completion criteria
All ten PS-063 specs at SPEC-DRAFT-COMPLETE; B-06 decision recorded; money contract tests defined; privacy and finance review pass.

## Required process specification inventory
- [x] [domain_schema](domain_schema.md) — PS-063-01
- [x] [validation_rules](validation_rules.md) — PS-063-02
- [x] [workflow_state_machine](workflow_state_machine.md) — PS-063-03
- [x] [commands_queries_events](commands_queries_events.md) — PS-063-04
- [x] [authorization_capabilities](authorization_capabilities.md) — PS-063-05
- [x] [failure_recovery_idempotency](failure_recovery_idempotency.md) — PS-063-06
- [x] [privacy_retention_abuse](privacy_retention_abuse.md) — PS-063-07
- [x] [observability_performance](observability_performance.md) — PS-063-08
- [x] [contract_and_acceptance_tests](contract_and_acceptance_tests.md) — PS-063-09
- [x] [import_export_backup_rollback](import_export_backup_rollback.md) — PS-063-10
