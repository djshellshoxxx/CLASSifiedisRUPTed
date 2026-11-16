# PS-011-02 — Validation rules: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-02.R01** Offer input is validated strictly against the schema; unknown fields are rejected with VALIDATION_FAILED.
- **PS-011-02.R02** Business rules check listing state, currency acceptance, self-dealing, blocks and open-offer caps before persistence.
- **PS-011-02.R03** Every rule violation maps to exactly one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | amount.amount is a positive integer string within limits and amount.currency is registered (F09.S03.M01) | VALIDATION_FAILED |
| V02 | listing exists, is published, kind sell, and not expired | BAZAAR_LISTING_NOT_OFFERABLE |
| V03 | amount.currency is in the listing's accepted currencies | BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED |
| V04 | buyerId != listing ownerId | BAZAAR_OFFER_SELF |
| V05 | neither party has blocked the other (F07.S02.M02) | BLOCKED_PARTY |
| V06 | buyer has no other open offer on the same listing variant | BAZAAR_OFFER_DUPLICATE |
| V07 | listing has fewer than 50 open offers | BAZAAR_OFFER_LIMIT |
| V08 | expiresAt between now+1h and now+7d | VALIDATION_FAILED |
| V09 | variantId present iff the listing has variants, and the variant has quantity ≥ 1 | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T01 | unit | PS-011-01.R01, PS-011-01.R03, PS-011-02.R01 | make offer with valid input | Offer stored with status made, revision 1, amount unchanged |
| TEST-PS-011-09.T02 | unit | PS-011-02.R02, PS-011-02.R03 | each rule V02–V09 violated in turn | the documented error code is returned and nothing is stored |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
