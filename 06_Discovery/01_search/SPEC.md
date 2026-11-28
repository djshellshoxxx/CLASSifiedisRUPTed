# F06.S01 — 01_search

**Status:** SPECIFIED. **Parent:** [F06](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F06.S01.M01 | [Search index](mod_index/SPEC.md) | SPECIFIED | Project published P0 listing data into search documents (SQLite FTS5) from bazaar/services/auctions/rentals events; L2 cell only; removal on unpublish/delete. |
| F06.S01.M02 | [Search query](mod_query/SPEC.md) | SPECIFIED | Full-text query parsing (bounded), pagination (cursor), saved searches with alert events. |
| F06.S01.M03 | [Search filters](mod_filter/SPEC.md) | SPECIFIED | Typed filters: category, listing kind, price range per currency, condition, distance bucket, barter-acceptable, posted-within; validation and index mapping. |

## Aggregation

Modules in this subfeature share the feature package `packages/discovery` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.published | F01.S01.M03 | F06.S01.M01 | external |
| federation.record.accepted | F11.S01.M02 | F06.S01.M01 | external |
| bazaar.listing.edited | F01.S01.M02 | F06.S01.M01 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F06.S01.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F06.S01.M01 | external |
| bazaar.listing.archived | F01.S01.M04 | F06.S01.M01 | external |
| bazaar.listing.closed | F01.S01.M04 | F06.S01.M01 | external |
| bazaar.listing.restored | F01.S01.M04 | F06.S01.M01 | external |
| bazaar.publication.renewed | F01.S01.M03 | F06.S01.M01 | external |
| bazaar.sell_terms.set | F01.S02.M01 | F06.S01.M01 | external |
| bazaar.variant.changed | F01.S03.M02 | F06.S01.M01 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F06.S01.M01 | external |
| bazaar.inventory.released | F01.S03.M01 | F06.S01.M01 | external |
| bazaar.inventory.restocked | F01.S03.M01 | F06.S01.M01 | external |
| services.offering.published | F03.S01.M01 | F06.S01.M01 | external |
| services.offering.withdrawn | F03.S01.M01 | F06.S01.M01 | external |
| rentals.offering.published | F05.S01.M01 | F06.S01.M01 | external |
| auctions.auction.scheduled | F04.S01.M01 | F06.S01.M01 | external |
| auctions.auction.opened | F04.S01.M01 | F06.S01.M01 | external |
| auctions.auction.extended | F04.S02.M02 | F06.S01.M01 | external |
| auctions.auction.closed | F04.S01.M03 | F06.S01.M01 | external |
| auctions.auction.cancelled | F04.S01.M01 | F06.S01.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F06.S01.M01 | external |
| moderation.action.applied | F12.S02.M01 | F06.S01.M01 | external |
| moderation.action.reverted | F12.S02.M01 | F06.S01.M01 | external |
| commerce.payment.reorged | F09.S01.M03 | F06.S01.M01 | external |
| commerce.payment.expired | F09.S01.M01 | F06.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F06.S01.M01 | external |
| discovery.index.updated | F06.S01.M01 | F06.S01.M02 | internal |
| identity.block.added | F07.S02.M02 | F06.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F06.S01.M02 | external |
