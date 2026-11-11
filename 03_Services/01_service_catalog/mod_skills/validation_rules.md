# PS-029-02 — Validation rules: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-02.R01** Offering input is validated strictly; unknown fields are rejected and every violation maps to one stable error code.
- **PS-029-02.R02** Taxonomy, currency, region precision (F06.S02.M01 assertPublicCell) and credential limits are checked before persistence and again at publish and on every published revision.
- **PS-029-02.R03** Free text is plain text only and is length-limited by code points.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | skillCodes has 1..10 distinct codes that exist in the taxonomy | SERVICES_SKILL_INVALID |
| V02 | rate.amount is a positive integer string within limits and currency is registered | VALIDATION_FAILED |
| V03 | serviceAreaCell is a valid geohash accepted by F06.S02.M01 assertPublicCell and is not longer than 5 characters | SERVICES_AREA_TOO_PRECISE |
| V04 | linked listing exists, has subtype service, belongs to the provider and is not archived | SERVICES_LISTING_NOT_SERVICE |
| V05 | credentials has at most 10 items, label and issuer ≤ 80 code points, year within 1950..2100 | VALIDATION_FAILED |
| V06 | provider has fewer than 20 published offerings | SERVICES_OFFERING_LIMIT |
| V07 | minBillableMinutes is present only for hourly and within 15..480 | VALIDATION_FAILED |
| V08 | rateType and currency equal the stored values on a published offering | SERVICES_RATE_IMMUTABLE |
| V09 | input has no unknown fields and serviceAreaCell is exactly 5 characters (a shorter cell is refused, never padded) | VALIDATION_FAILED |
| V10 | privacy.consent.check(federation_publish, relayId) is granted for every selected relay before the projection is signed | SERVICES_PUBLISH_CONSENT_MISSING |
| V11 | publish finds a provider-wide or offering calendar in F03.S01.M02 to copy providerTimeZone from | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T02 | unit | PS-029-02.R02, PS-029-02.R03 | each rule V01–V11 violated in turn | the documented code is returned and nothing is stored or signed |
| TEST-PS-029-09.T15 | unit | PS-029-02.R01 | create and revise with an unknown input field | VALIDATION_FAILED and nothing stored |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F03.S01.M02, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
