# PS-008-01 — Domain schema: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-01.R01** InventoryItem stores on-hand quantity per listing or variant; reserved and available are derived from active local holds and never stored independently.
- **PS-008-01.R02** InventoryHold is a local lease in the owner's vault with holder type, holder id, quantity, expiry, maximum lifetime and renewals; verified reservation statements of other principals are stored separately as PeerReservation evidence and never change availability.
- **PS-008-01.R03** Inventory is P2 data in the owner's vault; the public sees only a coarse in-stock indicator inside the signed listing projection.
- **PS-008-01.R04** PeerReservation records a verified classrup.bazaar.reservation/v1 of another principal keyed by (issuerDid, listingId, variantId, reservationCid) with holder, quantity, absolute expiresAt, status and provenance; it needs no local InventoryItem.

## Specification

### InventoryItem

Schema `classrup.bazaar.inventory_item/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| variantId? | uuidv7 — ref F01.S03.M02 Variant; absent for listings without variants |
| ownerId | did:key — local principal |
| onHand | int — 0..100000 |
| supersededAt? | timestamp — set when the listing gains variants and this listing-level item is retired |
| retiredAt? | timestamp — set while the variant is retired; retired items accept no new holds |
| depletedSince? | timestamp — set when available becomes 0 |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Unique (listingId, variantId) among items without supersededAt.
- onHand >= sum of quantity of active local holds on the item; available = onHand - that sum >= 0.
- Only the owner principal's vault changes onHand; ownerId equals the listing owner.

### InventoryHold

Schema `classrup.bazaar.inventory_hold/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| itemId | uuidv7 — ref InventoryItem in this vault |
| listingId | uuidv7 — denormalized for queries |
| variantId? | uuidv7 — denormalized |
| quantity | int — 1..onHand |
| holderType | enum — offer \| negotiation \| deal \| cycle \| giveaway; trade proposals use cycle with the proposal id (F02.S03.M02, N14) |
| holderId | uuidv7 — offer, negotiation, deal, cycle or request id; never a session (IDM-3) |
| linkedDealId? | uuidv7 — ref F09.S01.M01 Deal, set when the holder opened a Deal |
| status | enum — active \| frozen \| converted \| released \| expired |
| expiresAt | timestamp — now + ttl; ttl 60 s..14 d, default 15 min |
| maxExpiresAt | timestamp — <= createdAt + 30 d; for Deal-linked holds the Deal expiry capped at 30 d |
| renewals | int — 0..20 |
| reservationCids? | string[] — sha256- of reservation statements issued for this hold |
| reservationAudience? | did:key[] — <= 10 principals the reservations were sent to |
| releaseCid? | string — sha256- of the signed release sent when the hold ended early |
| releaseReason? | enum — released \| owner_override \| listing_gone \| deal_cancelled \| frozen \| expired |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one active or frozen hold per (itemId, holderType, holderId).
- Only holds with status active count against availability.
- expiresAt <= maxExpiresAt; status converted holds reduced onHand by quantity exactly once.
- A hold released or frozen before expiresAt with reservationCids has a releaseCid, unless holderType is cycle (F02.S03.M02 sends the cycle release notice).

### PeerReservation

Schema `classrup.bazaar.peer_reservation/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| reservationCid | string — sha256- of the verified classrup.bazaar.reservation/v1 envelope |
| issuerDid | did:key — signer, the listing author of the verified projection (F11.S01.M02) |
| listingId | uuidv7 — listing of the issuer, as in the statement |
| variantId? | uuidv7 — as in the statement |
| holder | object — {type, id} as in the statement |
| quantity | int — 1..100000 |
| expiresAt | timestamp — absolute expiry in the statement; evaluated on this vault's clock |
| status | enum — valid \| frozen \| released \| expired \| superseded |
| releaseCid? | string — sha256- of the verified release statement |
| provenance | object — {receivedVia: relay\|direct\|import, relayId?, receivedAt, verifiedAt} |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Unique (issuerDid, listingId, variantId, reservationCid).
- A PeerReservation never counts against any local availability and never references a local InventoryItem.
- status released or frozen implies releaseCid names a verified release signed by issuerDid that binds reservationCid.

### Storage DDL

```sql
CREATE TABLE bazaar_inventory_item (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, variant_id TEXT,
  on_hand INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_inventory_item_key ON bazaar_inventory_item(tenant_id, listing_id, ifnull(variant_id,''))
  WHERE json_extract(data,'$.supersededAt') IS NULL;
CREATE TABLE bazaar_inventory_hold (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, item_id TEXT NOT NULL, holder_type TEXT NOT NULL, holder_id TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_inventory_hold_holder ON bazaar_inventory_hold(tenant_id, item_id, holder_type, holder_id)
  WHERE status IN ('active','frozen');
CREATE INDEX bazaar_inventory_hold_expiry ON bazaar_inventory_hold(tenant_id, status, expires_at);
CREATE TABLE bazaar_peer_reservation (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, issuer_did TEXT NOT NULL, listing_id TEXT NOT NULL, variant_id TEXT,
  reservation_cid TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_peer_reservation_key ON bazaar_peer_reservation(tenant_id, issuer_did, listing_id, ifnull(variant_id,''), reservation_cid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T01 | unit | PS-008-01.R01, PS-008-01.R02, PS-008-02.R01, PS-008-02.R02 | hold 1 of L; hold 1 more | first held with expiry, second BAZAAR_INVENTORY_INSUFFICIENT; available never negative |
| TEST-PS-008-09.T02 | unit | PS-008-01.R03, PS-008-07.R01 | read public projection and event payloads | no quantities or holder ids outside P2 events; projection has only in-stock boolean |
| TEST-PS-008-09.T18 | integration | PS-008-01.R04 | B1 records S's reservation for L although B1 has no InventoryItem for L, then a release signed by K, then a valid release | PeerReservation stored valid with provenance and no itemId; K's release quarantined; valid release marks it released |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
