# PS-008-04 — Commands, queries and events: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-04.R01** hold, release, renew, convert and set_quantity are vault-local commands; issue_reservation is vault-local and produces the signed statement classrup.bazaar.reservation/v1; record_peer_reservation stores a verified incoming statement.
- **PS-008-04.R02** The InventoryPort for other modules consists of bazaar.inventory.hold, release, renew, convert, bazaar.inventory.check and bazaar.inventory.get_item, called inside the caller's own transaction when it runs in the same vault.
- **PS-008-04.R03** No command contacts a relay; relays only carry reservation statements as end-to-end encrypted envelopes when a counterparty needs them.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.inventory.hold` | bazaar.inventory.hold | [vault-local, port] { holder: { type, id }, ttlMs? (default 900000), linkedDealId?, lines: [{ listingId, variantId?, quantity }] (1..20) } | { holds: [{ holdId, listingId, variantId?, quantity, expiresAt }] } | VALIDATION_FAILED, BAZAAR_INVENTORY_NOT_HOLDABLE, BAZAAR_INVENTORY_INSUFFICIENT, BAZAAR_INVENTORY_HOLD_LIMIT | bazaar.inventory.held, bazaar.inventory.depleted | yes (Idempotency-Key) |
| `bazaar.inventory.release` | bazaar.inventory.release | [vault-local, port] { holder: { type, id } \| holdIds[], reason: released\|owner_override } | { released: int } | NOT_FOUND, CONFLICT_STATE | bazaar.inventory.released, bazaar.inventory.restocked | yes (Idempotency-Key) |
| `bazaar.inventory.renew` | bazaar.inventory.renew | [vault-local, port] { holder: { type, id }, ttlMs } | { holds: [{ holdId, expiresAt, renewals }] } | NOT_FOUND, CONFLICT_STATE, EXPIRED, BAZAAR_INVENTORY_HOLD_LIFETIME, BAZAAR_INVENTORY_FROZEN |  | yes (Idempotency-Key) |
| `bazaar.inventory.convert` | bazaar.inventory.convert | [vault-local, port] { holder: { type, id } \| linkedDealId } | { converted: int, onHand } | NOT_FOUND, CONFLICT_STATE, EXPIRED, BAZAAR_INVENTORY_FROZEN | bazaar.inventory.converted, bazaar.inventory.depleted | yes (Idempotency-Key) |
| `bazaar.inventory.set_quantity` | bazaar.inventory.adjust | [vault-local] { listingId, variantId?, onHand, expectedRevision? } | { itemId, onHand, available, revision } | NOT_FOUND, CONFLICT_REVISION, VALIDATION_FAILED, BAZAAR_INVENTORY_BELOW_RESERVED | bazaar.inventory.depleted, bazaar.inventory.restocked | yes (Idempotency-Key) |
| `bazaar.inventory.issue_reservation` | bazaar.inventory.issue_reservation | [vault-local + statement classrup.bazaar.reservation/v1] { holdId, audience: did:key[] } | { reservationCid, expiresAt } | NOT_FOUND, CONFLICT_STATE, BAZAAR_INVENTORY_FROZEN |  | yes (Idempotency-Key) |
| `bazaar.inventory.record_peer_reservation` | bazaar.inventory.record_peer | [vault-local] { statement: classrup.bazaar.reservation/v1 envelope, provenance } | { holdId, accepted: boolean, quarantineReason? } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.inventory.check` | bazaar.inventory.read | { lines: [{ listingId, variantId?, quantity }] (1..20) } | { ok: boolean, lines: [{ listingId, variantId?, available, ok }] } | VALIDATION_FAILED |
| `bazaar.inventory.get_item` | bazaar.inventory.read | { listingId, variantId? } | { item: InventoryItem, reserved, available } | NOT_FOUND |
| `bazaar.inventory.list_holds` | bazaar.inventory.read | { listingId?, status?, cursor?, limit <= 50 } | { items: InventoryHold[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.inventory.held` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, expiresAt } |
| `bazaar.inventory.released` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, reason: released\|expired\|owner_override\|listing_gone } |
| `bazaar.inventory.depleted` | P2 | { listingId, variantId?, reason: held\|sold } |
| `bazaar.inventory.restocked` | P2 | { listingId, variantId?, available } |
| `bazaar.inventory.converted` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, onHand } |
| `bazaar.inventory.conflict_detected` | P2 | { listingId, variantId?, holdIds[], reason: forked_reservation } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.created` | create the listing-level InventoryItem with onHand 1 for kinds sell, giveaway and rental; none for wanted, service and auction |
| `bazaar.listing.archived` | release active local holds with reason listing_gone unless a Deal is linked |
| `bazaar.listing.deleted` | delete InventoryItem and non-converted holds of the listing |
| `bazaar.variant.changed` | create, retire or reactivate the variant InventoryItem and supersede the listing-level item when the first variant is added |
| `commerce.deal.completed` | convert the hold whose linkedDealId equals the event dealId |
| `mutiny.cycle.completed` | convert holds with holderType cycle and holderId equal to cycleId |
| `mutiny.cycle.cancelled` | release holds with holderType cycle and holderId equal to cycleId |
| `mutiny.cycle.unlocked` | release holds with holderType cycle and holderId equal to cycleId when still active |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_INVENTORY_NOT_HOLDABLE | 409 | no | item missing, superseded, not owned locally, or listing not in a holdable state |
| BAZAAR_INVENTORY_INSUFFICIENT | 409 | no | fewer units available than requested for at least one line; nothing was held |
| BAZAAR_INVENTORY_HOLD_LIMIT | 409 | no | vault already has 500 active holds |
| BAZAAR_INVENTORY_HOLD_LIFETIME | 409 | no | renewal would exceed 30 days total life or 20 renewals |
| BAZAAR_INVENTORY_BELOW_RESERVED | 409 | no | on-hand cannot go below the reserved quantity |
| BAZAAR_INVENTORY_FROZEN | 409 | no | hold is frozen by a detected conflict and needs an owner decision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault.dispatch("bazaar.inventory.hold", { "holder": { "type": "offer", "id": "0192f3a5-..." }, "ttlMs": 604800000,
  "lines": [ { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "quantity": 1 } ] }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000051")
=> { "holds": [ { "holdId": "0192f3a6-...", "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "quantity": 1, "expiresAt": "2026-11-11T10:00:00.000Z" } ] }
vault.dispatch("bazaar.inventory.issue_reservation", { "holdId": "0192f3a6-...", "audience": ["did:key:z6Mk..."] })
=> { "reservationCid": "sha256-Zm9v...", "expiresAt": "2026-11-11T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T07 | contract | PS-008-04.R01, PS-008-04.R02, PS-008-09.R02 | each command and the reservation statement | outputs, events and statement validate; signature verifies with owner key |
| TEST-PS-008-09.T08 | integration | PS-008-04.R03, PS-008-07.R03 | reservation travels via relay mailbox | relay sees ciphertext and routing metadata only; no network call from hold/release/convert |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
