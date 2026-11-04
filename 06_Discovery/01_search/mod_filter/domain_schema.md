# PS-044-01 — Domain schema: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-01.R01** The Filter value object has a closed set of keys with typed ranges, and any unknown key is a validation failure.
- **PS-044-01.R02** Compilation output is a pair of SQL text and an ordered parameter array, with SQL text drawn only from a fixed set of fragments.
- **PS-044-01.R03** The canonical form of a filter is deterministic so equal filters produce equal cache keys and saved search comparisons.

## Specification

**Note:** Library module. It defines the Filter value object (schema classrup.discovery.filter/v1, embedded in queries and SavedSearch) but owns no persisted entity. Keys - categoryIds (1..10), listingKinds (1..6 of sell, wanted, giveaway, service, rental, auction), price {currency, min?, max?} in integer minor units 0..1 000 000 000 000, conditions (1..5 of new, like_new, good, fair, for_parts), distanceKm (one of 5, 10, 25, 50, 100), barterAcceptable (boolean), postedWithin (one of 24h, 7d, 30d).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T01 | unit | PS-044-01.R01, PS-044-02.R01 | validate a filter with every key valid | Result ok and canonical form equals golden |
| TEST-PS-044-09.T03 | property | PS-044-01.R03 | random key order and equivalent values | canonicalize returns identical bytes and cache keys |
| TEST-PS-044-09.T04 | unit | PS-044-01.R02, PS-044-03.R01 | compile each key alone and all together | SQL text and params equal golden fixtures |
| TEST-PS-044-09.T06 | integration | PS-044-01.R02, PS-044-07.R01 | compiled filter run against SQLite with 1 000 documents | returned set equals a brute-force JavaScript filter of the same data |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
