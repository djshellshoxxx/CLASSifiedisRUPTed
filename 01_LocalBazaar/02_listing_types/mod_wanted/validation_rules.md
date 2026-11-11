# PS-007-02 — Validation rules: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-02.R01** Want input is validated strictly, including keyword hygiene and Money rules.
- **PS-007-02.R02** The category must be an active leaf of the active policy pack and the listing must be of kind wanted.
- **PS-007-02.R03** Every violation maps to one stable error code.
- **PS-007-02.R04** The budget cap is per currency: maxBudget is at most 10^10 major units through the F09.S03.M03 helper maxAmount(currency), the same helper SellTerms, Variant and Offer use.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | keywords 1..10, each 2..40 code points after NFKC lowercase, no duplicates | VALIDATION_FAILED |
| V02 | categoryId is an active leaf category | BAZAAR_WANT_CATEGORY_INVALID |
| V03 | minCondition is one of new, like_new, good, fair, poor, for_parts | VALIDATION_FAILED |
| V04 | quantityWanted integer 1..100 | VALIDATION_FAILED |
| V05 | maxBudget amount positive integer string <= maxAmount(currency) and currency registered | BAZAAR_WANT_CURRENCY_UNKNOWN |
| V06 | neededBy is today or later and at most 365 days ahead | VALIDATION_FAILED |
| V07 | listing exists, is of kind wanted and has status draft, published or unpublished | CONFLICT_STATE |
| V08 | barterNote <= 280 code points and contains no contact or payment details pattern | VALIDATION_FAILED |
| V09 | owner has fewer than 100 open wants | BAZAAR_WANT_LIMIT |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T01 | unit | PS-007-01.R01, PS-007-01.R02, PS-007-02.R01, PS-007-02.R02 | define a valid want with minCondition good and a private budget | stored; keywords normalized; budget absent from projection builder output |
| TEST-PS-007-09.T02 | unit | PS-007-02.R03 | violate each rule V01-V09 | documented error code returned and nothing stored |
| TEST-PS-007-09.T11 | abuse | PS-007-02.R03 | create 101st open want and 31st define in an hour | BAZAAR_WANT_LIMIT and RATE_LIMITED |
| TEST-PS-007-09.T17 | property | PS-007-02.R04 | maxBudget at and above maxAmount(currency) for EUR and ETH | at the cap accepted, above refused; ETH budgets with 18 decimals are representable |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F18.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
