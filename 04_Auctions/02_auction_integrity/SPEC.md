# F04.S02 — 02_auction_integrity

**Status:** SPECIFIED. **Parent:** [F04](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F04.S02.M01 | [Anti-shill controls](mod_anti/SPEC.md) | SPECIFIED | Block seller and linked accounts (device/key links from F07) from bidding; heuristic shill scoring to F12 signals. |
| F04.S02.M02 | [Anti-sniping soft close](mod_sniping/SPEC.md) | SPECIFIED | Soft close: bid in final 2 min extends end by 2 min, max 30 extensions. |
| F04.S02.M03 | [Auction fraud review](mod_fraud/SPEC.md) | SPECIFIED | Review flagged auctions, void results with reason, notify bidders, feed F12 enforcement. |

## Aggregation

Modules in this subfeature share the feature package `packages/auctions` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| auctions.bid.placed | F04.S01.M02 | F04.S02.M01 | external |
| auctions.bid.outbid | F04.S01.M02 | F04.S02.M01 | external |
| auctions.bid.retracted | F04.S01.M02 | F04.S02.M01 | external |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M01 | external |
| auctions.auction.won | F04.S01.M03 | F04.S02.M01 | external |
| auctions.auction.scheduled | F04.S01.M01 | F04.S02.M01 | external |
| auctions.review.opened | F04.S02.M03 | F04.S02.M01 | internal |
| auctions.review.closed | F04.S02.M03 | F04.S02.M01 | internal |
| identity.attestation.added | F07.S03.M02 | F04.S02.M01 | external |
| identity.attestation.revoked | F07.S03.M02 | F04.S02.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F04.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M01 | external |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M02 | external |
| auctions.shill.suspected | F04.S02.M01 | F04.S02.M03 | internal |
| moderation.report.received | F12.S01.M01 | F04.S02.M03 | external |
| auctions.result.non_payment | F04.S01.M03 | F04.S02.M03 | external |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M03 | external |
| bazaar.listing.edited | F01.S01.M02 | F04.S02.M03 | external |
| moderation.appeal.decided | F12.S01.M03 | F04.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M03 | external |
