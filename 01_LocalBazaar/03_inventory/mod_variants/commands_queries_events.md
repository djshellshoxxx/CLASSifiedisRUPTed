# PS-009-04 — Commands, queries and events: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-04.R01** All commands are vault-local commands run by the local principal; none produces a signed statement; the changed variants reach others only inside the next signed listing projection from F01.S01.M03.
- **PS-009-04.R02** Each command calls bazaar.inventory.set_quantity and, when the price changed on a published listing, bazaar.listing_revision.record inside the same transaction.
- **PS-009-04.R03** bazaar.variant.changed carries ids and a change enum only, so the inventory and offer modules can react without reading private data.
- **PS-009-04.R04** bazaar.inventory.set_quantity is a synchronous upsert: add creates the per-variant InventoryItem in the same transaction, the first variant supersedes the listing-level item there, and no InventoryItem is created asynchronously from bazaar.variant.changed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.variant.add` | bazaar.variant.add | [vault-local] { listingId, label, attributes, price?, quantity, position? } | { variantId, inventoryItemId, revision: 1 } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_STATE, BAZAAR_VARIANT_LIMIT, BAZAAR_VARIANT_DUPLICATE, BAZAAR_VARIANT_CURRENCY_MISMATCH, BAZAAR_VARIANT_LISTING_HELD | bazaar.variant.changed | yes (Idempotency-Key) |
| `bazaar.variant.update` | bazaar.variant.update | [vault-local] { variantId, expectedRevision, label?, attributes?, price?, quantity?, position? } | { variantId, revision, priceChanged } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_VARIANT_DUPLICATE, BAZAAR_VARIANT_CURRENCY_MISMATCH, BAZAAR_INVENTORY_BELOW_RESERVED, BAZAAR_EDIT_REVISION_LIMIT | bazaar.variant.changed | yes (Idempotency-Key) |
| `bazaar.variant.retire` | bazaar.variant.retire | [vault-local] { variantId, expectedRevision } | { variantId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_VARIANT_IN_USE | bazaar.variant.changed | yes (Idempotency-Key) |
| `bazaar.variant.reactivate` | bazaar.variant.retire | [vault-local] { variantId, expectedRevision } | { variantId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_VARIANT_LIMIT, BAZAAR_VARIANT_DUPLICATE | bazaar.variant.changed | yes (Idempotency-Key) |
| `bazaar.variant.remove` | bazaar.variant.retire | [vault-local] { variantId, expectedRevision } | { variantId, deletedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_VARIANT_IN_USE | bazaar.variant.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.variant.list` | bazaar.variant.read | { listingId, status?: active\|all } | { items: [{ variant: Variant, onHand, reserved, available }] } | NOT_FOUND |
| `bazaar.variant.get` | bazaar.variant.read | { variantId } | { variant: Variant, onHand, reserved, available } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.variant.changed` | P1 | { listingId, variantId, ownerId, change: added\|updated\|retired\|reactivated\|removed, priceChanged: boolean, revision } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.deleted` | delete all Variant rows of the listing and write tombstones |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_VARIANT_LIMIT | 409 | no | listing already has 50 variants |
| BAZAAR_VARIANT_DUPLICATE | 409 | no | another variant has the same attributes |
| BAZAAR_VARIANT_CURRENCY_MISMATCH | 422 | no | variant price currency differs from the listing asking currency |
| BAZAAR_VARIANT_IN_USE | 409 | no | variant has active holds or open offers |
| BAZAAR_VARIANT_LISTING_HELD | 409 | no | listing-level stock has an active hold; release it before adding variants |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Ports: the module registers the ProjectionContributorPort of F01.S01.M03 (section variants: active variants with inStock from F01.S03.M01 at signing time). Privacy ports (N6): it registers ExportSectionPort (section bazaar.variants), DeletionPort (plan: delete variants of own listings with tombstones) and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02. Variants hold no counterparty data, so nothing is pseudonymized.

### Example

```
vault.dispatch("bazaar.variant.add", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "label": "Size M, blue",
  "attributes": { "size": "M", "colour": "blue" }, "price": { "amount": "2500", "currency": "EUR" }, "quantity": 3 },
  idempotencyKey: "0192f3a4-0000-7000-8000-000000000061")
inside the same transaction: bazaar.inventory.set_quantity { listingId, variantId, onHand: 3 } => { created: true, supersededItemId: "0192f3a4-aaaa-..." }
=> { "variantId": "0192f3ab-...", "inventoryItemId": "0192f3ab-bbbb-...", "revision": 1 }
event bazaar.variant.changed { listingId, variantId, ownerId, change: "added", priceChanged: false, revision: 1 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T05 | contract | PS-009-04.R01, PS-009-04.R03, PS-009-09.R02 | each command runs | outputs and bazaar.variant.changed payloads validate against registry |
| TEST-PS-009-09.T06 | integration | PS-009-04.R02, PS-009-06.R02 | update variant price on published listing | listing revision recorded as material in the same transaction; event emitted once |
| TEST-PS-009-09.T16 | integration | PS-009-04.R04 | add the first variant of L and inspect inventory inside and after the transaction; deliver bazaar.variant.changed afterwards | variant InventoryItem exists and the listing-level item is superseded before commit; the event handler creates nothing; an offer hold on the new variant succeeds immediately |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S01.M03, F01.S02.M01, F01.S04.M01, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
