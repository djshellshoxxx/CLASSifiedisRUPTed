# F01.S03.M02 — Listing variants

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S03](../SPEC.md). **Process IDs:** PS-009-01…PS-009-10. **Code:** `packages/bazaar/src/inventory/variants`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets a seller offer one listing in up to 50 variants (size, colour, condition), each with its own price and stock quantity. The Variant record owns attributes, price and ordering; the authoritative on-hand quantity is stored by F01.S03.M01 and this module passes the quantity to it inside the same vault transaction. Price changes are reported to F01.S01.M02 as material listing revisions. Variants are included in the signed listing projection; buyers learn of changes only by receiving a new signed statement.

## Responsibilities

- [object Object]
- Pass initial and changed quantities to F01.S03.M01 and keep the per-variant InventoryItem in step through bazaar.variant.changed.
- Report price changes to F01.S01.M02 so they count as material revisions and reach offers and negotiations.
- Refuse retiring or removing a variant that has active holds.

## Not responsible for

- On-hand quantity, holds and availability (F01.S03.M01).
- Listing-level asking price and accepted payment methods (F01.S02.M01); variant prices must use the listing's currency.
- Offers and negotiation on a variant (F01.S04.M01, F01.S04.M02) which reference variantId.
- Future: shared attribute templates per category and bulk CSV import of variants.

## User stories

- As a seller of shirts, I list sizes S, M and L with different stock, and buyers see which sizes are in stock.
- As a seller, I can change the price of one size and the app tells me buyers with open offers on that size will be notified.
- As a seller, I can retire a size that is out of production without breaking reservations already made.

## Edge cases

- Seller adds the 51st variant; BAZAAR_VARIANT_LIMIT is returned.
- Two variants have the same attribute set; BAZAAR_VARIANT_DUPLICATE is returned and the existing one is highlighted.
- Variant price currency differs from the listing's asking currency; BAZAAR_VARIANT_CURRENCY_MISMATCH is returned.
- Retire a variant with an active hold; BAZAAR_VARIANT_IN_USE is returned and the hold list is shown.
- Adding the first variant to a listing that has a listing-level hold; BAZAAR_VARIANT_LISTING_HELD is returned until the hold ends.
- Quantity edit lowers stock below the reserved amount; the error from the inventory module is surfaced unchanged and the variant is not modified.
- Same command replayed after offline queueing; one variant exists.

## UX and accessibility

- Variants editor: table of variants with label, attributes, price, quantity, status; add, edit, retire; reorder with drag and a button alternative.
- Variant picker in the buyer's view of a mirrored listing: options with stock indicator and price per option.

**States:** loading; empty; saving-local; saved-local; over-limit; in-use; conflict

**Accessibility:** Reordering has up and down buttons as the single-pointer alternative to dragging (WCAG 2.5.7).; Table has header cells and each row has a labelled action group.; Price inputs state the currency in the visible label and use inputmode decimal.

## Owned data

- `Variant` (classrup.bazaar.variant/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `bazaar.variant.add`, `bazaar.variant.update`, `bazaar.variant.retire`, `bazaar.variant.reactivate`, `bazaar.variant.remove`
- Queries: `bazaar.variant.list`, `bazaar.variant.get`
- Emits: `bazaar.variant.changed`
- Consumes: `bazaar.listing.deleted`

## Dependencies

F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-009-01 | [Domain schema](domain_schema.md) | 3 |
| PS-009-02 | [Validation rules](validation_rules.md) | 3 |
| PS-009-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-009-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-009-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-009-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-009-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-009-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-009-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-009-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/inventory/variants/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A variant price change always creates a material listing revision and a bazaar.variant.changed event with priceChanged true.
- Variants with active holds or open offers can never be retired or removed.
