# F06.S02.M01 Coarse location regions (PS-047)

Headless pure library: no commands, queries, events, capabilities or statement handlers.

## Exports (index.ts)
- Functions: `encode(lat, lon, 4|5|6)`, `decode(cell)`, `neighbors(cell)`, `snap(lat, lon, level)`, `assertPublicCell(cell)`, `cellsForRadius(centerCell, radiusKm)`, `bucketBetween(a, b)`, `isCell`.
- Errors (defined once here): `discoveryGeoErrors` with DISCOVERY_COORD_INVALID, DISCOVERY_PRECISION_FORBIDDEN, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_TOO_LARGE. Malformed cells and precisions return the common VALIDATION_FAILED.
- Constants and types: `Cell`, `Level`, `Bucket`, `RADII_KM`, `BUCKETS`, `MAX_CELLS`, `LEVEL_PRECISION`, `BUCKET_MESSAGE_KEYS`.
- `checkPublisherGuardsCells(publish)`: contract helper for publishing modules (N8); fails (DISCOVERY_PRECISION_FORBIDDEN) when a publish function lets a 6 or 11 character cell through.

## Ports the composition root must supply
None.

## Deviations and interpretations
- `snap(..., 'L0')` returns the empty string (no location) after validating the coordinates; L4 is not accepted (VALIDATION_FAILED).
- `assertPublicCell` returns VALIDATION_FAILED for non-geohash characters and DISCOVERY_PRECISION_FORBIDDEN for any other length than 0, 4, 5 (V03).
- Fixture `encode(57.64911, 10.40744, 11)` is checked with a test-only helper (`test-support.ts`) because `encode` only accepts precisions 4..6 (V02).
- `cellsForRadius` includes every cell whose rectangle intersects the circle (exact minimum great-circle distance), so it is a superset of the points within the radius. Circles that contain a pole, or sit within a few degrees of one, need more than 512 cells and return DISCOVERY_RADIUS_TOO_LARGE; that is the spec behaviour.
- Radius values outside {5,10,25,50,100} (including 200) return DISCOVERY_RADIUS_TOO_SMALL (V04 and T06).
- The spec says no public-facing function emits cells longer than 5; `encode(...,6)` and `snap(..., 'L3')` do emit 6 characters because L3 is a defined private level. Only `assertPublicCell` may pass cells to public payloads.

## Test rows not covered
- T12 (load, 100 000 iterations of cellsForRadius(100)): not deterministic within the time limit on shared machines; not claimed.
- T13 (traceability run): performed by the traceability tool, not by a test in this module.
- T10 asserts no fetch, Date.now or Math.random use; it cannot prove absence of other I/O.

## Open questions
- The spec wants `classrup_discovery_geo_radius_cells` (relay only) and `debug geo.rejected` logs; the library has no logger or metrics port, so callers record them.
