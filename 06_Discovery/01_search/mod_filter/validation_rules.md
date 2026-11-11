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
| V04 | distanceKm is one of 5, 10, 25, 50, 100 (minimum 5 km) | DISCOVERY_RADIUS_TOO_SMALL |
| V05 | distanceKm is accompanied by a center cell of exactly 5 characters or a stored home cell | DISCOVERY_FILTER_CENTER_REQUIRED |
| V06 | category expansion yields at most 200 category ids | DISCOVERY_FILTER_INVALID |
| V07 | postedWithin is one of 24h, 7d, 30d and condition values are in the enum | DISCOVERY_FILTER_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T01 | unit | PS-044-01.R01, PS-044-02.R01 | validate a filter with every key valid | Result ok and canonical form equals golden |
| TEST-PS-044-09.T02 | unit | PS-044-02.R02, PS-044-02.R03 | price without currency, min above max, distance without center, distance 3 km | the documented error code each time with the field path |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
