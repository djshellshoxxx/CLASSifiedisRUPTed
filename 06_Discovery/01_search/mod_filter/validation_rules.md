# PS-044-02 — Validation rules: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-02.R01** Validation is strict and total - every key, range and combination is checked before compilation.
- **PS-044-02.R02** Combination rules prevent meaningless filters, such as prices without a currency and distances without a center.
- **PS-044-02.R03** Each violation maps to one stable error code with the offending path in fields.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | filter has only known keys and every list is non-empty and within its maximum length | DISCOVERY_FILTER_INVALID |
| V02 | price.min and price.max are integers within 0..1 000 000 000 000 and min is not greater than max | DISCOVERY_FILTER_INVALID |
| V03 | price filter carries a registered currency code | DISCOVERY_FILTER_CURRENCY_REQUIRED |
| V04 | distanceKm is at least 5 km (F06.S02.M01 V04) | DISCOVERY_RADIUS_TOO_SMALL |
| V05 | distanceKm is accompanied by a center cell of 4 or 5 characters or a stored home cell | DISCOVERY_FILTER_CENTER_REQUIRED |
| V06 | category expansion yields at most 200 category ids | DISCOVERY_FILTER_INVALID |
| V07 | postedWithin is one of 24h, 7d, 30d and condition values are in the enum (new, like_new, good, fair, poor, for_parts) | DISCOVERY_FILTER_INVALID |
| V08 | distanceKm is one of the allowed radii 5, 10, 25, 50, 100 (F06.S02.M01 V06) | DISCOVERY_RADIUS_NOT_ALLOWED |
| V09 | the center cell passes F06.S02.M01 assertPublicCell (at most 5 characters) | DISCOVERY_PRECISION_FORBIDDEN |
| V10 | barterAcceptable and inStock are booleans and wantAcceptsCondition is one of new, like_new, good, fair, poor, for_parts | DISCOVERY_FILTER_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T01 | unit | PS-044-01.R01, PS-044-02.R01 | validate a filter with every key valid | Result ok and canonical form equals golden |
| TEST-PS-044-09.T02 | unit | PS-044-02.R02, PS-044-02.R03 | price without currency, min above max, distance without center, distance 3 km, distance 7 km and 200 km, 6-character center | DISCOVERY_FILTER_CURRENCY_REQUIRED, DISCOVERY_FILTER_INVALID, DISCOVERY_FILTER_CENTER_REQUIRED, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_PRECISION_FORBIDDEN, each with the field path |
| TEST-PS-044-09.T14 | integration | PS-044-01.R05, PS-044-02.R01 | compile and run inStock true, barterAcceptable true, wantAcceptsCondition for each of the 6 conditions, and inStock "yes" and wantAcceptsCondition "mint" against the seed index | SQL text and params equal golden fixtures; returned sets equal a brute-force JavaScript filter (good returns wants with minCondition good, fair, poor or for_parts); the two bad values are DISCOVERY_FILTER_INVALID with their field paths |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
