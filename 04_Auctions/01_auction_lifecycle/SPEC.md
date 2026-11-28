# F04.S01 — 01_auction_lifecycle

**Status:** SPECIFIED. **Parent:** [F04](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F04.S01.M01 | [Auction setup and reserve](mod_reserve/SPEC.md) | SPECIFIED | English ascending auctions on a listing: start price, hidden reserve, bid increment table, start/end times (1 h..14 d). |
| F04.S01.M02 | [Bidding](mod_bids/SPEC.md) | SPECIFIED | Place bids (≥ current + increment), optional proxy max bid, retraction rules, serialized per auction. |
| F04.S01.M03 | [Auction close](mod_close/SPEC.md) | SPECIFIED | Close at end (lease-guarded), determine winner vs reserve, hand off to F09 settlement; winner non-payment → second-chance offer. |

## Aggregation

Modules in this subfeature share the feature package `packages/auctions` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.unpublished | F01.S01.M03 | F04.S01.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F04.S01.M01 | external |
| auctions.auction.closed | F04.S01.M03 | F04.S01.M01 | internal |
| auctions.bid.placed | F04.S01.M02 | F04.S01.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M01 | external |
| auctions.auction.opened | F04.S01.M01 | F04.S01.M02 | internal |
| auctions.auction.closed | F04.S01.M03 | F04.S01.M02 | internal |
| auctions.auction.won | F04.S01.M03 | F04.S01.M02 | internal |
| auctions.auction.cancelled | F04.S01.M01 | F04.S01.M02 | internal |
| auctions.auction.extended | F04.S02.M02 | F04.S01.M02 | external |
| auctions.auction.frozen | F04.S01.M01 | F04.S01.M02 | internal |
| auctions.result.voided | F04.S02.M03 | F04.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M02 | external |
| commerce.deal.opened | F09.S01.M01 | F04.S01.M03 | external |
| commerce.deal.completed | F09.S01.M01 | F04.S01.M03 | external |
| commerce.deal.cancelled | F09.S01.M01 | F04.S01.M03 | external |
| commerce.payment.expired | F09.S01.M01 | F04.S01.M03 | external |
| auctions.auction.frozen | F04.S01.M01 | F04.S01.M03 | internal |
| auctions.result.voided | F04.S02.M03 | F04.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M03 | external |
