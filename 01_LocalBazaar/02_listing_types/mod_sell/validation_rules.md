# PS-006-02 — Validation rules: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-02.R01** Money is validated as an integer minor-unit string with a registered currency; floating point and unknown currencies are rejected.
- **PS-006-02.R02** Payment methods must be consistent with their supporting fields, and free text must not carry payment details.
- **PS-006-02.R03** Price changes on published listings are rate limited.
- **PS-006-02.R04** The money cap is per currency: amounts are at most 10^10 major units, computed once by the F09.S03.M03 helper maxAmount(currency) from the registry decimals, and the same helper is used by WantSpec, Variant, Offer and NegotiationRound.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | askingPrice.amount is a positive decimal-integer string <= maxAmount(askingPrice.currency) = 10^(10 + registry decimals) and has no sign, point or exponent | VALIDATION_FAILED |
| V02 | every currency code is registered in the currency registry | BAZAAR_SELL_CURRENCY_UNKNOWN |
| V03 | askingPrice.currency is within acceptedCurrencies of 1..5 distinct codes | VALIDATION_FAILED |
| V04 | paymentMethods has 1..3 distinct valid values | VALIDATION_FAILED |
| V05 | cryptoAssets present and registered iff crypto is in paymentMethods | BAZAAR_SELL_CRYPTO_ASSET_REQUIRED |
| V06 | minOffer, if present, has the asking currency and is > 0 and <= asking price | BAZAAR_SELL_MIN_OFFER_INVALID |
| V07 | deliveryNote <= 280 code points and contains no IBAN, card number or crypto address pattern | BAZAAR_SELL_PAYMENT_DETAILS_PUBLIC |
| V08 | pickup or delivery is true | VALIDATION_FAILED |
| V09 | listing exists, is of kind sell and is in status draft, published or unpublished | CONFLICT_STATE |
| V10 | at most 10 asking-price changes within 24 h on a published listing | RATE_LIMITED |
| V11 | barterAcceptable, if present, is a boolean | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T01 | unit | PS-006-01.R01, PS-006-02.R01, PS-006-02.R02 | define valid terms; send amount 49.99 as float; unknown currency | stored with integer string; float and unknown currency rejected with documented codes |
| TEST-PS-006-09.T02 | unit | PS-006-02.R03 | violate each rule V01-V11 | documented error code returned and nothing stored |
| TEST-PS-006-09.T11 | abuse | PS-006-02.R03 | 11 price changes within 24 h | 11th returns RATE_LIMITED with retryAfterMs |
| TEST-PS-006-09.T16 | property | PS-006-02.R04 | for every registry currency, amounts at maxAmount(currency) and maxAmount(currency) + 1, including ETH 0.5 and JPY 10^10 | at the cap accepted, above refused with VALIDATION_FAILED; the same helper result is used by WantSpec, Variant and Offer validation |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
