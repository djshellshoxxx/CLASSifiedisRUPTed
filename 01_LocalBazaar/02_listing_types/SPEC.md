# F01.S02 — 02_listing_types

**Status:** SPECIFIED. **Parent:** [F01](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F01.S02.M01 | [Sell listing type](mod_sell/SPEC.md) | SPECIFIED | Asking price (Money), accepted payment methods (cash/crypto/external), negotiable flag, pickup/delivery options; no checkout custody. |
| F01.S02.M02 | [Wanted listing type](mod_wanted/SPEC.md) | SPECIFIED | Wanted posts with category, condition, max budget or barter-acceptable flag; feeds LocalMutiny matching wants. |
| F01.S02.M03 | [Giveaway listing type](mod_giveaway/SPEC.md) | SPECIFIED | Free items: request queue, recipient selection (first-come or giver choice), anti-hoarding limits per requester. |

## Aggregation

Modules in this subfeature share the feature package `packages/bazaar` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.deleted | F01.S01.M01 | F01.S02.M01 | external |
| bazaar.listing.published | F01.S01.M03 | F01.S02.M02 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S02.M02 | external |
| bazaar.listing.expired | F01.S01.M04 | F01.S02.M02 | external |
| bazaar.listing.closed | F01.S01.M04 | F01.S02.M02 | external |
| bazaar.listing.archived | F01.S01.M04 | F01.S02.M02 | external |
| bazaar.listing.deleted | F01.S01.M01 | F01.S02.M02 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S02.M03 | external |
| bazaar.listing.expired | F01.S01.M04 | F01.S02.M03 | external |
| bazaar.listing.closed | F01.S01.M04 | F01.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F01.S02.M03 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S02.M03 | external |
