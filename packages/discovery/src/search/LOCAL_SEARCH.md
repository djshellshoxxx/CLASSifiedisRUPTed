# Retained-listing search

`discovery.listing.search` keeps its original text, region-prefix, barter, blocked-owner and availability fields. The optional `options` object adds:

- `categoryId`: an exact category ID, without taxonomy descendant expansion.
- `kind` and `condition`: the signed listing's declared values.
- `price: { currency, min?, max? }`: decimal-string minor-unit bounds in the declared currency. Comparison uses bigint, with no exchange-rate conversion or fiat-only restriction.
- `centerCell` (4–5 characters) and `distanceKm` (5, 10, 25, 50 or 100): approximate regional overlap. A radius requires a center; a center alone can inform ranking. Four-character published locations remain eligible when their cell overlaps the covering cells. Results are not assertions about a person's distance or exact location.
- `seenWithinDays`: 1, 7 or 30 days since this cache first retained the listing. Updates preserve that timestamp; it is not a verified publication time.
- `sort`: `retained` (default) preserves the existing order. `ranked` applies bundled recency and optional coarse-distance weights with deterministic ID tie-breaking. Text is still a substring eligibility filter: this cache has no FTS index or BM25 score. Promotion is disabled and relay ranking policy is not applied.

The result shape remains `{ items, source: 'locally-retained', staleOrExcluded }`. Expired, conflicted, blocked and unavailable listings are excluded before optional ranking. Search does not mutate signed projections. The PWA can opt in to these query options; its existing search calls keep their behavior.

The separate SQL filter compiler targets the planned search-document schema. This local-cache adapter intentionally supports the actual retained-listing contract, including 78-digit money values and four-character published regions, rather than pretending the SQL schema is present.
