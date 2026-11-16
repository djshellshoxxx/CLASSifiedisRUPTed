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
| V03 | each required pair has a quote with expiresAt at least 30 minutes after the local clock | MUTINY_QUOTE_UNAVAILABLE |
| V04 | consentDeadline of the revision is at or before earliestQuoteExpiry | MUTINY_QUOTE_TOO_SHORT |
| V05 | rate num and den are positive integers and the conversion formula is applied with a single HALF_EVEN rounding | VALIDATION_FAILED |
| V06 | peer record recomputes to identical converted amounts and normalizationHash | MUTINY_NORMALIZATION_MISMATCH |
| V07 | quote source label is present, and manual or proposer-stated rates are labelled sourceSigned false | MUTINY_QUOTE_SOURCE_UNLABELLED |
| V08 | no declared value is non-positive or above 1 000 000 000 000 minor units | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T01 | unit | PS-025-01.R01, PS-025-01.R02, PS-025-02.R02, PS-025-09.R03 | compute the 3-currency example | converted amounts 12000, 11700, 11463 EUR minor; normalizationHash stable |
| TEST-PS-025-09.T02 | property | PS-025-01.R02, PS-025-02.R02 | 10 000 random conversions vs reference | identical results with single HALF_EVEN rounding; no floating point |
| TEST-PS-025-09.T03 | unit | PS-025-02.R01, PS-025-02.R03 | each rule V01..V08 violated in turn | documented error code and nothing stored |
| TEST-PS-025-09.T04 | unit | PS-025-01.R03, PS-025-02.R03 | JPY settlement with EUR items | exponent difference applied exactly as in MNY-4 |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
