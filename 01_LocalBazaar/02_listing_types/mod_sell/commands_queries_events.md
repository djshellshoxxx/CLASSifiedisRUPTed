# PS-006-04 — Commands, queries and events: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-04.R01** bazaar.sell_terms.define is a vault-local command that creates or replaces the terms using expectedRevision; it produces no signed statement, since the signed projection in F01.S01.M03 embeds the P0 part of the terms.
- **PS-006-04.R02** Events are emitted only while the listing is published or unpublished and contain public fields only, never minOffer.
- **PS-006-04.R03** bazaar.sell_terms.get is the only way other modules read the terms; minOffer is returned only to the owner and to the offers module acting for the owner.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.sell_terms.define` | bazaar.sell_terms.define | [vault-local] { listingId, expectedRevision? (absent on first definition), askingPrice, acceptedCurrencies, paymentMethods, cryptoAssets?, negotiable?, minOffer?, pickup?, delivery?, deliveryNote? } | { sellTermsId, revision, priceChanged, unsentChanges } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RATE_LIMITED, BAZAAR_SELL_CURRENCY_UNKNOWN, BAZAAR_SELL_CRYPTO_ASSET_REQUIRED, BAZAAR_SELL_MIN_OFFER_INVALID, BAZAAR_SELL_PAYMENT_DETAILS_PUBLIC | bazaar.sell_terms.set | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.sell_terms.get` | bazaar.sell_terms.read | { listingId } | { terms: SellTerms } | NOT_FOUND |
| `bazaar.sell_terms.accepts` | bazaar.sell_terms.read | { listingId, currency } | { accepted: boolean, negotiable: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.sell_terms.set` | P0 | { listingId, ownerId, revision, askingPrice, acceptedCurrencies, paymentMethods, negotiable, priceChanged } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_SELL_CURRENCY_UNKNOWN | 422 | no | a currency code is not in the registry |
| BAZAAR_SELL_CRYPTO_ASSET_REQUIRED | 422 | no | crypto accepted without a registered asset list, or assets without crypto |
| BAZAAR_SELL_MIN_OFFER_INVALID | 422 | no | minimum offer has wrong currency or exceeds the asking price |
| BAZAAR_SELL_PAYMENT_DETAILS_PUBLIC | 422 | no | free text looks like payment details that must not be published |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault.dispatch("bazaar.sell_terms.define", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd",
  "askingPrice": { "amount": "5000", "currency": "EUR" }, "acceptedCurrencies": ["EUR"], "paymentMethods": ["cash", "external"],
  "negotiable": true, "minOffer": { "amount": "3500", "currency": "EUR" }, "pickup": true },
  idempotencyKey: "0192f3a4-0000-7000-8000-000000000071")
=> { "sellTermsId": "0192f3ac-...", "revision": 1, "priceChanged": false, "unsentChanges": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T04 | contract | PS-006-04.R01, PS-006-04.R03, PS-006-09.R02 | define and get run | outputs and bazaar.sell_terms.set payload validate; minOffer absent from event |
| TEST-PS-006-09.T05 | integration | PS-006-04.R02, PS-006-06.R03 | define on published P with price change | event emitted once; revision recorded as material; draft L emits no event |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
