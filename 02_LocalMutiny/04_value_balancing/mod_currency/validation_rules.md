# PS-025-02 — Validation rules: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-02.R01** Normalization refuses unregistered currencies, missing quotes, expired or soon-to-expire quotes, and more than 5 currencies or 8 quotes.
- **PS-025-02.R02** Recomputation by receivers uses exactly the same integer arithmetic so any difference is a mismatch and not a tolerance issue.
- **PS-025-02.R03** The effective consent deadline can never be later than the earliest quote expiry.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every currency is registered in F09.S03.M01 | COMMERCE_CURRENCY_UNKNOWN |
| V02 | at most 5 distinct currencies and 8 quotes per record and at most 16 items | MUTINY_NORMALIZATION_LIMIT |
| V03 | each required pair has a quote of purpose barter_normalization from F09.S03.M02 whose expiresAt is at least 30 minutes after the local clock and not more than 24 h after issue | MUTINY_QUOTE_UNAVAILABLE |
| V04 | when more than one currency is involved the revision consentDeadline is ≤ now + 24 h and ≤ earliestQuoteExpiry (N16), otherwise re-quote and fresh consent through a quote_refresh revision | MUTINY_QUOTE_TOO_SHORT |
| V05 | rate num and den are positive integers and the conversion formula is applied with a single HALF_EVEN rounding | VALIDATION_FAILED |
| V06 | peer record recomputes to identical converted amounts and normalizationHash | MUTINY_NORMALIZATION_MISMATCH |
| V07 | quote source label is present, and the quoteChecks entry of each quote agrees with the presented quote: a relay-signed quote is sourceSigned true only when commerce.fx_quote.verify_embedded says so, a manual quote is issuerSigned true and sourceSigned false, and a direct-provider quote is sourceSigned false with the label 'source asserted by <issuer pseudonym>, not verifiable'; a presented sourceSigned true that the check does not confirm is refused | MUTINY_QUOTE_SOURCE_UNLABELLED |
| V08 | no declared value is non-positive or above 1 000 000 000 000 minor units | VALIDATION_FAILED |
| V09 | every pinned quote is displayed with the label 'pinned rate agreed by all parties' and its source before any consent can be signed | MUTINY_QUOTE_SOURCE_UNLABELLED |
| V10 | every quote in a received revision passes commerce.fx_quote.verify_embedded {quote, embeddingSignerId: the revision author, embeddingReceivedAt: the local receive time, embeddingSignedAt: the revision's claimed time, reDerive: true}; a failed relay or issuer signature, or a quote expired on the local clock before commit, blocks consent | COMMERCE_RATE_SIGNATURE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T01 | unit | PS-025-01.R01, PS-025-01.R02, PS-025-02.R02, PS-025-09.R03 | compute the 3-currency example | converted amounts 12000, 11700, 11463 EUR minor; normalizationHash stable |
| TEST-PS-025-09.T02 | property | PS-025-01.R02, PS-025-02.R02 | 10 000 random conversions vs reference | identical results with single HALF_EVEN rounding; no floating point |
| TEST-PS-025-09.T03 | unit | PS-025-02.R01, PS-025-02.R03 | each rule V01..V09 violated in turn | documented error code and nothing stored |
| TEST-PS-025-09.T04 | unit | PS-025-01.R03, PS-025-02.R03 | JPY settlement with EUR items | exponent difference applied exactly as in MNY-4 |
| TEST-PS-025-09.T16 | contract | PS-025-04.R04, PS-025-02.R03 | compute for the 3-currency example with consent deadlines of 23 h 30 min and 72 h | quote requests carry purpose barter_normalization and validForMs ≤ 86400000; 23 h 30 min accepted with every rate labelled 'pinned rate agreed by all parties'; 72 h refused with MUTINY_QUOTE_TOO_SHORT |
| TEST-PS-025-09.T18 | unit | PS-025-01.R01, PS-025-02.R01 | single-currency JPY subject | no NormalizationRecord referenced, no 24 h cap, toleranceRef EUR->JPY 163/1 returned |
| TEST-PS-025-09.T20 | contract | PS-025-04.R05, PS-025-02.R02, PS-025-05.R02 | received revision embedding a relay-signed quote, a manual quote presented as sourceSigned true, a direct-provider ecb-daily quote with an invented rate and a quote with a broken relay signature | verify_embedded called once per quote with the revision author and local receive time; quoteChecks give sourceSigned true, then issuerSigned true with sourceSigned false and MUTINY_QUOTE_SOURCE_UNLABELLED for the false claim, then 'source asserted by <issuer pseudonym>, not verifiable' with the ECB deviation, then COMMERCE_RATE_SIGNATURE_INVALID; normalizationHash still recomputes; consent is blocked for the false sourceSigned claim and the broken signature, while the direct-provider quote stays consentable with its label and deviation shown |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
