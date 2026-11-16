# PS-011-01 — Domain schema: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-01.R01** An Offer stores listing, variant, buyer, seller, amount as integer minor units, currency, optional note, expiry and status, with tenant and revision per CTR-ID-001.
- **PS-011-01.R02** Offer records are P2 (visible to buyer and seller only) and retained under RET-EVIDENCE because accepted offers form commerce evidence.
- **PS-011-01.R03** The offer amount is immutable after creation; changing the price requires a new offer or a negotiation round.

## Specification

### Offer

Schema `classrup.bazaar.offer/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| listingId | uuidv7 — ref F01.S01.M01 Listing; must be published |
| variantId? | uuidv7 — ref F01.S03.M02 Variant; required when listing has variants |
| buyerId | actorId — offer maker |
| sellerId | actorId — copied from listing owner at creation |
| amount | Money — CTR-MNY-001; > 0; ≤ 1 000 000 000 000 minor units |
| note? | string — ≤ 280 code points, plain text |
| expiresAt | timestamp — createdAt + 1 h..7 d |
| status | enum — made \| accepted \| rejected \| withdrawn \| expired |
| decisionReason? | enum — seller_rejected \| blocked \| listing_unavailable \| superseded \| timeout |
| listingRevisionAtOffer | int — listing revision seen by buyer |
| listingChangedSinceOffer | boolean — set by consumer of bazaar.listing.edited |
| dealId? | uuidv7 — ref F09.S01.M01 Deal, set on accept |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one offer with status made per (buyerId, listingId, variantId).
- status accepted implies dealId is set and an inventory hold exists for the same quantity.
- buyerId differs from sellerId.

### Storage DDL

```sql
CREATE TABLE bazaar_offer (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, variant_id TEXT,
  buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, amount_minor TEXT NOT NULL, currency TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_offer_open ON bazaar_offer(tenant_id, buyer_id, listing_id, ifnull(variant_id,''))
  WHERE status = 'made';
CREATE INDEX bazaar_offer_listing ON bazaar_offer(tenant_id, listing_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T01 | unit | PS-011-01.R01, PS-011-01.R03, PS-011-02.R01 | make offer with valid input | Offer stored with status made, revision 1, amount unchanged |
| TEST-PS-011-09.T17 | e2e | PS-011-01.R02, PS-011-04.R01 | mobile buyer makes offer, seller accepts on another device | both see accepted state; screen passes axe with zero serious issues |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
