# F01.S03.M01 — Inventory availability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S03](../SPEC.md). **Process IDs:** PS-008-01…PS-008-10. **Code:** `packages/bazaar/src/inventory/availability`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Tracks how many units of a listing or variant the principal has on hand and which units are reserved. Holds are local reservations (leases, CTR-IDM-001 IDM-3 and IDM-8) inside the owner's vault; they stop the same unit being promised twice by this vault, whether to a buyer (offers, negotiation), a giveaway recipient or a barter cycle. Other parties rely on a signed reservation statement with an expiry, not on any distributed lock. This module defines the InventoryPort used by F01.S04.M01, F01.S04.M02, F01.S02.M03 and LocalMutiny cycle locks: hold, release, convert, renew and check.

## Responsibilities

- Own InventoryItem (on-hand quantity per listing or variant) and InventoryHold (lease with holder, quantity, expiry).
- Provide the InventoryPort commands bazaar.inventory.hold (all-or-nothing for up to 20 lines), release, renew, convert and the queries check and get.
- Issue a signed reservation statement (classrup.bazaar.reservation/v1) for a hold on request, with expiry, and store verified peer reservation statements as read-only evidence.
- Emit held, released, depleted events and keep available = onHand - sum of active local holds never negative.
- Detect conflicting signed reservations from a forked second device of the same principal, freeze the affected holds and require an explicit owner decision.

## Not responsible for

- Variants, their attributes and prices (F01.S03.M02); this module only receives a quantity per variant id.
- Offers, negotiation and cycle consent (F01.S04.M01, F01.S04.M02, F02.S03.M01); they request holds, they do not own them.
- Payment and Deal creation (F09.S01.M01).
- Any claim about items in other principals' vaults; their availability is known only through their signed reservation or listing statements.
- Future: multi-location stock and serial-numbered units.

## User stories

- As a seller with one bike, accepting one buyer's offer reserves the bike so I cannot accidentally accept a second buyer in this app.
- As a participant in a barter cycle, my item is reserved for the cycle for a stated time, and I can see when the reservation expires.
- As a buyer, I receive a signed reservation from the seller with an expiry, and the app tells me it is the seller's promise, not a guarantee.

## Edge cases

- Two accept clicks race in two tabs on the last unit; the vault serializes them in one IndexedDB transaction and the second gets BAZAAR_INVENTORY_INSUFFICIENT.
- A hold expires during an app restart; at start the sweep releases it and emits released with reason expired before any new hold is accepted.
- The same holder repeats hold with the same Idempotency-Key; the original hold is returned without taking more units.
- The owner lowers on-hand below the reserved quantity; BAZAAR_INVENTORY_BELOW_RESERVED is returned and the UI lists the holds to release.
- A cycle needs 3 items across 3 vaults; each vault holds only its own item and issues its own statement; if one vault cannot hold, the cycle coordinator receives no reservation from it and must not treat the item as reserved.
- Two devices of the same principal each reserved the last unit while offline; on sync both holds become frozen, bazaar.inventory.conflict_detected is emitted, and no hold converts until the owner releases one.
- Peer reservation statement arrives signed by a key that is not the listing owner's; it is quarantined and not shown as a reservation.
- Hold renewal requested after total lifetime of 30 days; BAZAAR_INVENTORY_HOLD_LIFETIME is returned.

## UX and accessibility

- Stock editor on the listing: quantity stepper (0 to 100000), reserved count and available count, with the list of holds (holder type, quantity, expires).
- Holds list: active, frozen and ended holds, release button with confirm dialog, conflict banner for frozen holds.
- Reservation detail for a buyer or cycle participant: signed reservation card with seller identity, quantity, expiry and the text This is the seller's signed promise; it does not guarantee delivery.

**States:** loading; in-stock; low-stock; held-out; depleted; conflict-frozen; pending-offline

**Accessibility:** Stock changes and hold expiry warnings are announced in an aria-live polite region.; Quantity stepper has a numeric input alternative with visible label and inputmode numeric.; Release and confirm buttons are at least 44x44 px with accessible names that include the holder and quantity.

## Owned data

- `InventoryItem` (classrup.bazaar.inventory_item/v1, P2, RET-STANDARD)
- `InventoryHold` (classrup.bazaar.inventory_hold/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.inventory.hold`, `bazaar.inventory.release`, `bazaar.inventory.renew`, `bazaar.inventory.convert`, `bazaar.inventory.set_quantity`, `bazaar.inventory.issue_reservation`, `bazaar.inventory.record_peer_reservation`
- Queries: `bazaar.inventory.check`, `bazaar.inventory.get_item`, `bazaar.inventory.list_holds`
- Emits: `bazaar.inventory.held`, `bazaar.inventory.released`, `bazaar.inventory.depleted`, `bazaar.inventory.restocked`, `bazaar.inventory.converted`, `bazaar.inventory.conflict_detected`
- Consumes: `bazaar.listing.created`, `bazaar.listing.archived`, `bazaar.listing.deleted`, `bazaar.variant.changed`, `commerce.deal.completed`, `mutiny.cycle.completed`, `mutiny.cycle.cancelled`, `mutiny.cycle.unlocked`

## Dependencies

F01.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-008-01 | [Domain schema](domain_schema.md) | 3 |
| PS-008-02 | [Validation rules](validation_rules.md) | 3 |
| PS-008-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-008-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-008-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-008-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-008-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-008-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-008-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-008-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/inventory/availability/index.ts`.

## Acceptance criteria

- All tests T01-T17 pass in CI.
- available never goes negative and a unit is never converted twice, including under concurrent tabs and forked devices.
- The UI and APIs never describe a reservation as guaranteed or as accepted by the peer without the signed acknowledgement.
