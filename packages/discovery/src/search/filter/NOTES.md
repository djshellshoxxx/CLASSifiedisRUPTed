# F06.S01.M03 Search filters (PS-044)

Headless pure library: no commands, queries, events, capabilities or statement handlers. Imports only F06.S02.M01 (`../../geoprivacy/coarse/index.ts`).

## Exports (index.ts)
- `validateFilter(input, ports): Result<ValidatedFilter>`: strict, total validation; resolves category expansion (max 200 ids), the centre cell and the covering cells.
- `canonicalize(filter)`, `filterCacheKey(filter)`: sorted keys, sorted de-duplicated lists, integer amounts; equal filters give equal bytes.
- `compileFilter(validated, nowMs): Result<{ sql, params }>`: fixed SQL fragments over alias `d` (columns category_id, listing_kind, currency, price_minor, condition, geo_cell5, barter, first_seen_at), values only as bound parameters; fragment order is category, kind, price, condition, distance, barter, posted; an empty filter compiles to `1 = 1`.
- Errors defined here: DISCOVERY_FILTER_INVALID, DISCOVERY_FILTER_CURRENCY_REQUIRED, DISCOVERY_FILTER_CENTER_REQUIRED (`discoveryFilterErrors`). DISCOVERY_RADIUS_TOO_SMALL is reused from F06.S02.M01; port failures return DEPENDENCY_UNAVAILABLE.

## Ports the composition root must supply (`FilterPorts`)
- `categories.expand(categoryId): Result<readonly string[] | null>`: the id plus descendants, null when unknown; optional `categories.snapshotAgeMs(): number` (above 30 days sets `hints.categoriesMayBeOutOfDate`).
- `currencies.isRegistered(code): Result<boolean>`.
- optional `homeCell(): string | undefined`: stored 5 character home cell used when a distance filter has no `centerCell`.

## Deviations and interpretations
- `compileFilter` takes the `ValidatedFilter` returned by `validateFilter` (not a bare Filter) because category expansion and the centre cell come from ports and compilation must stay pure.
- The closed key set has one extra optional key, `centerCell` (5 characters), because the spec requires a search centre for distance filters (V05) but lists no key for it; it is only accepted together with `distanceKm`. When it is absent the home cell is written into the canonical filter.
- Price amounts are integers (numbers, as in the spec example); decimal digit strings are accepted on input and normalised to numbers. Stored saved-search money elsewhere uses decimal strings (kernel rule); see open questions.
- Distances above 25 km use precision-4 covering cells, compiled to `geo_cell5 BETWEEN '<cell>0' AND '<cell>z'` ranges OR-ed together (documents carry 5 character cells only).
- Violations return the first error in fixed key order with its path in `fields`. A distance value outside the set returns DISCOVERY_RADIUS_TOO_SMALL before the centre check.
- `validateFilter` can also return DISCOVERY_RADIUS_TOO_LARGE (from the coarse library) for circles at the poles.

## Test rows not covered
- T11 (explain-plan and metrics): the specified DDL has no category index, so the "category index" half cannot be shown, and the metric `classrup_discovery_filter_validation_total` needs a metrics port the library does not have. Not claimed.
- T12 (traceability): performed by the traceability tool.
- T06 runs against `node:sqlite` with the discovery_doc columns and cell index (no FTS table); T07 timing uses a fake port.

## Open questions
- Should saved-search filters carry price as decimal strings (kernel money rule) rather than integers? The spec example and V02 use integers.
- A category index on discovery_doc (category_id) is implied by the performance budget but absent from F06.S01.M02's DDL; that belongs to the index module.
