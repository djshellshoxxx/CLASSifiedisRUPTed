# PS-002-02 — Validation rules: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-02.R01** Input is parsed strictly against classrup.bazaar.listing/v1; unknown keys are rejected and location keys are rejected with a dedicated code.
- **PS-002-02.R02** Referenced category, media and subtype must resolve locally before the draft is stored.
- **PS-002-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | payload has no unknown keys and no keys named lat, lon, latitude, longitude, address, street, postcode | BAZAAR_LISTING_LOCATION_TOO_PRECISE |
| V02 | regionCell is lowercase geohash base32 of length 4 or 5 | BAZAAR_LISTING_LOCATION_TOO_PRECISE |
| V03 | title 3..120 code points after NFC trim, no control or zero-width characters | VALIDATION_FAILED |
| V04 | description <= 5000 code points; tags <= 10 items of 2..30 code points | VALIDATION_FAILED |
| V05 | kind in enum and subtypeRef present iff kind is service, rental or auction | VALIDATION_FAILED |
| V06 | categoryId resolves to an active leaf category (depth 1..4, no children) in the active policy pack | BAZAAR_LISTING_CATEGORY_INVALID |
| V07 | condition present when kind is sell, giveaway or rental | VALIDATION_FAILED |
| V08 | mediaRefs <= 10; each blob exists locally, is jpeg/png/webp, <= 5 MiB and has no GPS tag | BAZAAR_LISTING_MEDIA_INVALID |
| V09 | vault holds fewer than 50 drafts | BAZAAR_LISTING_DRAFT_LIMIT |
| V10 | delete is requested only for status draft | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T01 | unit | PS-002-01.R01, PS-002-01.R03, PS-002-02.R01 | create a valid sell draft | Listing stored with status draft, revision 1; unknown field rejected |
| TEST-PS-002-09.T02 | unit | PS-002-02.R02, PS-002-02.R03 | violate each rule V01-V10 in turn | the documented error code is returned and nothing is stored |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
