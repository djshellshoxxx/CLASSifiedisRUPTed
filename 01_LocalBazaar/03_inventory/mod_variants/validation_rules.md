# PS-009-02 — Validation rules: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-02.R01** Variant input is validated strictly, including money and currency rules from CTR-MNY-001.
- **PS-009-02.R02** Uniqueness and limits are enforced inside the same transaction as the write.
- **PS-009-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | label 1..60 and attributes 1..5 pairs within length limits | VALIDATION_FAILED |
| V02 | price amount is a positive integer string <= 1 000 000 000 000 minor units | VALIDATION_FAILED |
| V03 | price currency equals the listing asking currency | BAZAAR_VARIANT_CURRENCY_MISMATCH |
| V04 | listing has fewer than 50 non-deleted variants | BAZAAR_VARIANT_LIMIT |
| V05 | attributesHash is unique among the listing's non-deleted variants | BAZAAR_VARIANT_DUPLICATE |
| V06 | quantity is an integer 0..100000 | VALIDATION_FAILED |
| V07 | retire or delete only when no active hold and no open offer exists for the variant | BAZAAR_VARIANT_IN_USE |
| V08 | adding the first variant requires the listing-level item to have no active hold | BAZAAR_VARIANT_LISTING_HELD |
| V09 | listing kind is sell, giveaway or rental and status is draft, published or unpublished | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T01 | unit | PS-009-01.R01, PS-009-01.R03, PS-009-02.R01, PS-009-02.R02 | add a valid variant with quantity 3 | Variant stored, inventory item onHand 3, 50-variant and 5-attribute limits enforced |
| TEST-PS-009-09.T03 | unit | PS-009-02.R03 | violate each rule V01-V09 | documented error code returned and nothing stored |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
