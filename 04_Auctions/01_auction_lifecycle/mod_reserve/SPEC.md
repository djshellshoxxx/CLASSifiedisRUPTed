# F04.S01.M01 — reserve

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F04). **Parent:** F04.S01.

## Purpose and business behavior
Lets a seller set a private minimum sale price (reserve) on an auction. The reserve is compared with accepted bids and never shown to bidders or the public; they see only whether the reserve is not set, not yet met, or met. The reserve can be lowered while no bid has met it, and can be raised only before the first accepted bid. Once met, it is fixed. The reserve is a sale condition, not a payment or escrow.

## User stories
- As a seller, I set a minimum price that stays private and see only the status "reserve met" or "not met" for my auction.
- As a seller, I can lower the reserve if I need to, but I cannot raise it after bidding has started.
- As a bidder, I know whether the reserve has been met, and I never learn its value.

## Scope
- Owns: reserve value per auction, reserve state (`UNSET`, `SET`, `MET`), reserve history, public `reserve_status` projection.
- Consumes: auction state and revision (F04), accepted bids (F04.S01.M02), currency registry (F09.S03.M01), listing creation (F01.S01.M01).
- Out of scope: opening price rules (F01 and F04), close outcome (F04.S01.M03), bidding (F04.S01.M02).

## Public interfaces
Commands `reserve.set`, `reserve.lower`; query `reserve.status`; events `auction.reserve.set`, `auction.reserve.lowered` (seller only), `auction.reserve.met` (public). Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F01.S01.M01 `mod_create` (auction creation), F09.S03.M01 `mod_currency`. Downstream: F04.S01.M02 `mod_bids` (bid acceptance sets MET), F04.S01.M03 `mod_close` (uses `reserve_met`). Contracts: CTR-SCH-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

## Data ownership
Canonical owner of reserve values and history: F04.S01.M01 (this module), embedded in the auction (`auc_`, owned by F04). Close record (F04.S01.M03) stores only `reserve_met`. Currency registry: F09.S03.M01. Consumers reference these by full ID.

## Risk considerations
- Disclosure of the reserve value through events, errors, logs or exports.
- Bait-and-switch: raising the reserve after bids.
- Race between a raise and an accepted bid.
- Probing the reserve through repeated changes or status checks.
- Seller collusion to inflate the reserve and avoid a sale.

## Completion criteria
All ten process specs (PS-035-01 to PS-035-10) are SPEC-DRAFT-COMPLETE; the MET-lock invariant is specified; the public projection excludes the value; implementation and tests are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-035-01
- [x] [validation_rules.md](validation_rules.md) — PS-035-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-035-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-035-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-035-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-035-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-035-07
- [x] [observability_performance.md](observability_performance.md) — PS-035-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-035-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-035-10
