# PS-006-01 — Domain schema: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-01.R01** SellTerms stores the asking price as Money (integer minor units string), accepted currencies, payment methods, negotiable flag, minimum offer and fulfilment options for one listing.
- **PS-006-01.R02** SellTerms is P3 while the listing is a draft and P0 inside the signed projection once published; payment instructions are never stored.
- **PS-006-01.R03** Free-text fields are short, plain text and screened so no account number, wallet address or contact detail becomes public.
- **PS-006-01.R04** SellTerms carries the public barterAcceptable flag (default false), exposed in the projection and in bazaar.sell_terms.set so barter matching and discovery filters can use it (N15).

## Specification

### SellTerms

Schema `classrup.bazaar.sell_terms/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing of kind sell; unique |
| ownerId | did:key — local principal |
| askingPrice | Money — CTR-MNY-001; > 0; <= maxAmount(currency) = 10^(10 + registry decimals) minor units (F09.S03.M03) |
| acceptedCurrencies | string[] — 1..5 registered currency codes, includes askingPrice.currency |
| paymentMethods | string[] — 1..3 of cash \| crypto \| external |
| cryptoAssets? | string[] — 1..5 registry codes (for example BTC, USDC); required when crypto is accepted |
| negotiable | boolean — default true |
| barterAcceptable | boolean — default false; public in the projection (N15) |
| minOffer? | Money — same currency as askingPrice; > 0 and <= askingPrice; never published, only used locally |
| pickup | boolean — default true |
| delivery | boolean — default false |
| deliveryNote? | string — <= 280 code points, plain text, no payment details |
| priceChangeCount24h | int — derived counter, 0..10 |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one SellTerms exists per sell listing and it cannot exist for other kinds.
- askingPrice.currency is in acceptedCurrencies and every code is registered in F09.S03.M01.
- minOffer is never part of any event, projection or statement.
- Field classes are annotated per F10.S02.M02 (minOffer P3; askingPrice, acceptedCurrencies, paymentMethods, cryptoAssets, negotiable, barterAcceptable, pickup, delivery and deliveryNote P0 once projected).

### Storage DDL

```sql
CREATE TABLE bazaar_sell_terms (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  asking_amount TEXT NOT NULL, asking_currency TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_sell_terms_listing ON bazaar_sell_terms(tenant_id, listing_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T01 | unit | PS-006-01.R01, PS-006-02.R01, PS-006-02.R02 | define valid terms; send amount 49.99 as float; unknown currency | stored with integer string; float and unknown currency rejected with documented codes |
| TEST-PS-006-09.T10 | abuse | PS-006-01.R02, PS-006-01.R03, PS-006-07.R01, PS-006-07.R02 | scan projection, events and logs; note with IBAN; schema search for payment instruction fields | no minOffer or drafts leave device; projected subset only after publish; note rejected; no payment instruction field exists |
| TEST-PS-006-09.T17 | contract | PS-006-01.R04 | define with barterAcceptable true on published P | bazaar.sell_terms.set carries barterAcceptable true and the projection preview of F01.S01.M03 exposes it; minOffer still absent |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
