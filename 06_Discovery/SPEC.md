# F06 — Local discovery

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `discovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F06.S01 01_search](01_search/SPEC.md) — 3 modules
- [F06.S02 02_geoprivacy](02_geoprivacy/SPEC.md) — 3 modules
- [F06.S03 03_ranking](03_ranking/SPEC.md) — 2 modules

## Aggregation

The feature is enabled by flag `F06` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F07, F09, F10, F11, F12, F15, F18.

### Cross-subfeature and external events

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
| identity.block.added | F07.S02.M02 | F06.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F06.S01.M02 | external |
| federation.record.accepted | F11.S01.M02 | F06.S02.M02 | external |
| identity.block.added | F07.S02.M02 | F06.S02.M02 | external |
| comms.meetup.cancelled | F08.S03.M03 | F06.S02.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F06.S02.M02 | external |
| commerce.deal.completed | F09.S01.M01 | F06.S02.M02 | external |
| comms.thread.archived | F08.S01.M02 | F06.S02.M02 | external |
| privacy.deletion.requested | F10.S01.M04 | F06.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F06.S02.M02 | external |
