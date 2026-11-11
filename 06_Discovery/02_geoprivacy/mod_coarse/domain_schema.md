# PS-047-01 — Domain schema: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-01.R01** Location levels map to geohash precision exactly as CTR-PRV-001 defines - L1 is 4 characters, L2 is 5, L3 is 6 - and L4 is exact coordinates that this library never returns.
- **PS-047-01.R02** A Cell is a lowercase geohash string; invalid characters or lengths are rejected, not repaired.
- **PS-047-01.R03** Distance buckets are the closed set lt5, 5_10, 10_25, 25_50 and gt50, derived from cell-center distance by the haversine formula on a sphere of radius 6 371.0088 km.

## Specification

**Note:** Library module with no persisted entity. Value types - Cell (geohash string of 4..6 characters), Level (L0..L3), Bucket (lt5, 5_10, 10_25, 25_50, gt50). Functions - encode(lat, lon, precision), decode(cell), neighbors(cell), snap(lat, lon, level), assertPublicCell(cell), cellsForRadius(centerCell of 4 or 5 characters, radiusKm) returning precision-5 cells for 5, 10 and 25 km and precision-4 cells for 50 and 100 km, bucketBetween(cellA, cellB) for cells of 4..6 characters.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T01 | unit | PS-047-01.R01, PS-047-01.R02 | known geohash vectors for encode and decode at precisions 4, 5, 6 | exact strings above and decode centers within cell bounds |
| TEST-PS-047-09.T02 | property | PS-047-01.R02, PS-047-03.R01 | 10 000 random valid points | snap is idempotent, decode(snap(p)) bounds contain p, and all points in one cell snap to the same cell |
| TEST-PS-047-09.T03 | property | PS-047-01.R02 | neighbors of random cells | symmetric relation, 8 distinct neighbors except at poles, wrap across longitude 180 |
| TEST-PS-047-09.T07 | property | PS-047-01.R03, PS-047-03.R02 | random center pairs of 4, 5 and 6 characters | bucketBetween is symmetric, monotone in true distance, uses cell centers only, and a number is never returned |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
