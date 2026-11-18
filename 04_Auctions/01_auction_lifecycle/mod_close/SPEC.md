# F04.S01.M03 — close

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F04). **Parent:** F04.S01.

## Purpose and business behavior
Ends an auction at its effective end time (base end plus accepted extensions). It decides one of three outcomes from the accepted bids and the reserve status: sold to the highest accepted bidder, unsold, or cancelled. For a sale, the winner must confirm within 48 hours; confirmation creates a transaction record (`trx_`) that F09 uses for settlement. The module never records a payment as made. Compensation between buyer and seller is a direct arrangement; the platform holds no funds.

## User stories
- As a seller, I see my auction end at the correct time and learn whether it sold, without learning the reserve value.
- As a winner, I confirm the sale and see the amount and the transaction reference before any payment step.
- As an operator, I can cancel an auction for integrity reasons only with a second approver, and every close is recorded once.

## Scope
- Owns: close records (one per `auc_`), end-state and confirmation transitions, the `trx_` handoff on confirmation, auction cancellation.
- Consumes: accepted bids and sequence (F04.S01.M02), reserve status (F04.S01.M01), effective end (F04.S02.M01), receipts and settlement (F09.S02.M01).
- Out of scope: payment claims (`clm_`, F09), disputes (F09.S02.M02), runner-up routing (Future).

## Public interfaces
Commands `close.run`, `auction.cancel`, `auction.cancel_operator`, `close.confirm_winner`; query `close.get`; events `auction.closed`, `auction.winner_notified`, `auction.winner_confirmed`, `auction.unconfirmed`, `auction.cancelled`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F04.S01.M02 `mod_bids`, F04.S02.M02 `mod_sniping` (end-time signals), F09.S02.M01 `mod_receipts`. Downstream: F09 settlement (`trx_`), F13 notifications. Contracts: CTR-COM-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Data ownership
Canonical owner of close records: F04.S01.M03 (this module), one per `auc_`. Canonical owner of transactions (`trx_`) and claims (`clm_`): F09 (CTR-COM-001). Reserve value: F04.S01.M01. Bids: F04.S01.M02. Consumers reference these by full ID.

## Risk considerations
- Close-time races with late bids and extensions.
- Reserve value leaking through outcome messages.
- Winner non-confirmation or non-payment; no platform escrow (D04, D09 defaults).
- Seller-linked winners (shill awards).
- Repeated or duplicated close records.
- Mis-labelled settlement states ("paid") that overstate what the platform knows.

## Completion criteria
All ten process specs (PS-034-01 to PS-034-10) are SPEC-DRAFT-COMPLETE; close record uniqueness and atomic `trx_` handoff specified; no "paid" label anywhere; implementation and tests are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-034-01
- [x] [validation_rules.md](validation_rules.md) — PS-034-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-034-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-034-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-034-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-034-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-034-07
- [x] [observability_performance.md](observability_performance.md) — PS-034-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-034-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-034-10
