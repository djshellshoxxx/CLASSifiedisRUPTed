# PS-044-01 — Domain schema: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-01.R01** The Filter value object has a closed set of keys with typed ranges, and any unknown key is a validation failure.
- **PS-044-01.R02** Compilation output is a pair of SQL text and an ordered parameter array, with SQL text drawn only from a fixed set of fragments.
- **PS-044-01.R03** The canonical form of a filter is deterministic so equal filters produce equal cache keys and saved search comparisons.
- **PS-044-01.R04** Distance filters compile by cell precision - precision-5 cells match geo_cell exactly, precision-4 cells match the stored and indexed geo_cell4 column, and documents with a 4-character (L1) cell match only radii of 25 km or more.
- **PS-044-01.R05** The keys inStock (boolean, compiled to d.in_stock = ?) and wantAcceptsCondition (one condition value, compiled to d.want_min_condition IN (...) over the minimum conditions that accept an item of that condition) filter the columns F06.S01.M01 copies from the projection's inStock and want.minCondition, next to barterAcceptable (d.barter = ?).

## Specification

**Note:** Library module. It defines the Filter value object (schema classrup.discovery.filter/v1, embedded in queries and SavedSearch) but owns no persisted entity. Keys - categoryIds (1..10), listingKinds (1..6 of sell, wanted, giveaway, service, rental, auction), price {currency, min?, max?} in integer minor units 0..1 000 000 000 000, conditions (1..6 of new, like_new, good, fair, poor, for_parts, matching F01.S01.M01 and the F06.S01.M01 index), distanceKm (one of 5, 10, 25, 50, 100) with a center cell of 4 or 5 characters, barterAcceptable (boolean, d.barter = ?), inStock (boolean, d.in_stock = ?), wantAcceptsCondition (one condition value; the condition order from best to worst is new, like_new, good, fair, poor, for_parts, and a want accepts an item at its minCondition or better, so the value compiles to d.want_min_condition IN (the value and every worse value), for example good gives good, fair, poor and for_parts; only wanted listings carry want_min_condition), postedWithin (one of 24h, 7d, 30d). Distance compile rule over cellsForRadius(center, distanceKm) from F06.S02.M01 - 5 and 10 km give precision-5 cells C5 compiled to d.geo_cell IN (C5); 25 km gives precision-5 cells C5 compiled to (d.geo_cell IN (C5) OR (length(d.geo_cell) = 4 AND d.geo_cell IN (P4))) where P4 are the distinct 4-character prefixes of C5; 50 and 100 km give precision-4 cells C4 compiled to d.geo_cell4 IN (C4), served by index discovery_doc_cell4.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T01 | unit | PS-044-01.R01, PS-044-02.R01 | validate a filter with every key valid | Result ok and canonical form equals golden |
| TEST-PS-044-09.T03 | property | PS-044-01.R03 | random key order and equivalent values | canonicalize returns identical bytes and cache keys |
| TEST-PS-044-09.T04 | unit | PS-044-01.R02, PS-044-03.R01, PS-044-01.R04 | compile each key alone and all together, including distanceKm 5, 10, 25, 50 and 100 around u4pru and condition poor | SQL text and params equal golden fixtures; 25 km has the L1 prefix branch, 50 and 100 km use d.geo_cell4 IN (...) |
| TEST-PS-044-09.T06 | integration | PS-044-01.R02, PS-044-07.R01, PS-044-01.R04 | compiled filters, including distanceKm 50 and 100 km and L1 documents, run against SQLite with 1 000 documents | returned set equals a brute-force JavaScript filter of the same data and is non-empty for 50 and 100 km |
| TEST-PS-044-09.T14 | integration | PS-044-01.R05, PS-044-02.R01 | compile and run inStock true, barterAcceptable true, wantAcceptsCondition for each of the 6 conditions, and inStock "yes" and wantAcceptsCondition "mint" against the seed index | SQL text and params equal golden fixtures; returned sets equal a brute-force JavaScript filter (good returns wants with minCondition good, fair, poor or for_parts); the two bad values are DISCOVERY_FILTER_INVALID with their field paths |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
