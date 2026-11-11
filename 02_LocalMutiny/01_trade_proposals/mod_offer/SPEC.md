# F02.S01.M03 — Barter offer items

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S01](../SPEC.md). **Process IDs:** PS-013-01…PS-013-10. **Code:** `packages/mutiny/src/trade_proposals/offer`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A TradeLeg says that one giver hands a defined set of items to one receiver as part of a proposal or cycle. A direct two-party proposal has two legs of 1..5 items each; a cycle of N participants has N legs of exactly one item with quantity 1 in the MVP. A leg records item references, quantities, the listing revision the parties looked at and the declared value. Own items are verified against the local inventory; other parties' items are verified only against their signed listing projections and their signed reservation statements, and are labelled accordingly.

## Responsibilities

- Define legs from item references with ownership and availability verification through the InventoryPort for the principal's own items and through signed listing projections for others' items.
- Keep each leg immutable once defined; replace it by defining a new leg, and mark legs referenced by a sealed revision so they cannot be voided.
- Void unreferenced legs after 24 hours and enforce the limits of 8 legs per subject, 5 items per direct leg and quantity 1..99 per item.
- Own the error codes MUTINY_ITEM_DUPLICATE, MUTINY_ITEM_NOT_OWNED and MUTINY_ITEM_UNAVAILABLE (N1), which F02.S02.M05 references, and register export, deletion and retention handlers with F10 (N6).

## Not responsible for

- Reserving items (F02.S03.M02) and holding inventory (F01.S03.M01); a leg is a description, not a reservation.
- Declared values and plausibility (F02.S04.M03) and normalization (F02.S04.M02).
- Sealing legs into a revision and signing (F02.S01.M04).
- Future: legs with service or rental components, bundles in cycles, and items with serial numbers.

## User stories

- As a proposer, I choose which of my items go to the other person and which of theirs I ask for, and I see immediately which of my own items are available.
- As a recipient, I see that the other person's items are listed by them and signed, and that availability is their claim until they sign a reservation.
- As a proposer, I can swap an item in a draft leg without affecting other legs.

## Edge cases

- The same inventory item is put into two legs of one subject; the second define is refused as a duplicate item.
- The principal's own item has quantity 1 and is reserved for another cycle; define is refused as unavailable without naming the other cycle.
- The other party's listing projection was tombstoned; define is refused because the item no longer exists as a signed public fact.
- The listing was edited after the leg was drafted; the leg keeps the listing revision hash it was defined against and shows a notice that the listing changed.
- A leg is defined with giver equal to receiver; refused.
- A cycle leg tries to carry two items; refused in the MVP because cycle legs are single-item.
- Item quantity requested exceeds the listing quantity; refused with the available quantity in the message.

## UX and accessibility

- Leg editor: two columns (I give, I receive) listing selectable items from my inventory and the other party's published items, with quantity steppers and declared value fields.
- Leg summary card per hand-over with item thumbnails, quantity, declared value, listing revision notice and a basis chip (verified here, signed listing, claimed).

**States:** loading; empty; draft; defined; referenced; voided; listing-changed; error

**Accessibility:** Quantity steppers have labels including the item name and are operable by keyboard.; Each leg card reads as a sentence, such as 'You give Lamp, quantity 1, declared 40.00 EUR, to Bob'.; Status and basis are text chips, not color alone.

## Owned data

- `TradeLeg` (classrup.mutiny.trade_leg/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.leg.define`, `mutiny.leg.void`
- Queries: `mutiny.leg.get`, `mutiny.leg.list_for_subject`
- Emits: `mutiny.leg.defined`
- Consumes: `mutiny.proposal.revised`, `bazaar.listing.edited`, `bazaar.listing.unpublished`, `privacy.deletion.completed`

## Dependencies

F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-013-01 | [Domain schema](domain_schema.md) | 3 |
| PS-013-02 | [Validation rules](validation_rules.md) | 3 |
| PS-013-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-013-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-013-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-013-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-013-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-013-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-013-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-013-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/trade_proposals/offer/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A leg never presents a peer's availability claim as locally verified.
- Items occur at most once per subject and cycle legs carry exactly one item with quantity 1.
