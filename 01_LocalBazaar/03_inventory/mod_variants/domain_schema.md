# PS-009-01 — Domain schema: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-01.R01** A Variant stores label, a small attribute map, price as Money in the listing currency, position and status; quantity is not stored here.
- **PS-009-01.R02** Variants are part of the owner's listing data (P0 once published inside the signed projection, P3 while draft).
- **PS-009-01.R03** At most 50 variants exist per listing and at most 5 attribute pairs per variant.
- **PS-009-01.R04** The projection subset contributed through the ProjectionContributorPort is exactly {variantId, label, attributes, price?, inStock} per active variant; quantities and retired variants are never contributed.

## Specification

### Variant

Schema `classrup.bazaar.variant/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| ownerId | did:key — local principal |
| label | string — 1..60 code points |
| attributes | object — 1..5 pairs, key 1..20 and value 1..40 code points, keys from size, colour, condition, material, model, other |
| price? | Money — CTR-MNY-001; > 0; <= maxAmount(currency) (F09.S03.M03); same currency as SellTerms.askingPrice; absent means the listing asking price applies |
| position | int — 0..49 |
| status | enum — active \| retired \| deleted |
| attributesHash | string — sha256- over JCS(attributes), unique per listing among active and retired |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most 50 variants with status active or retired per listing; positions are unique among them.
- price currency equals the listing asking currency whenever price is present.
- A variant with active holds or open offers is never retired or deleted.
- Every active or retired variant has an InventoryItem in F01.S03.M01 created in the same transaction as the variant.
- Field classes are annotated per F10.S02.M02 (P3 draft; label, attributes and price P0 once projected).

### Storage DDL

```sql
CREATE TABLE bazaar_variant (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, status TEXT NOT NULL,
  position INTEGER NOT NULL, attributes_hash TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_variant_attrs ON bazaar_variant(tenant_id, listing_id, attributes_hash) WHERE status <> 'deleted';
CREATE UNIQUE INDEX bazaar_variant_pos ON bazaar_variant(tenant_id, listing_id, position) WHERE status <> 'deleted';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T01 | unit | PS-009-01.R01, PS-009-01.R03, PS-009-02.R01, PS-009-02.R02 | add a valid variant with quantity 3 | Variant stored, inventory item onHand 3, 50-variant and 5-attribute limits enforced |
| TEST-PS-009-09.T02 | unit | PS-009-01.R02, PS-009-07.R01 | read projection and events | variants only in projection; no quantities in event or projection beyond in-stock flag |
| TEST-PS-009-09.T18 | contract | PS-009-01.R04 | F01.S01.M03 builds the projection of L with variants V1 (stock 3), V2 (stock 0) and a retired V3 | variants subset has exactly {variantId, label, attributes, price?, inStock} for V1 and V2, inStock false for V2, no V3 and no quantities |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S01.M03, F01.S02.M01, F01.S04.M01, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
