# F04 — Auctions

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `auctions`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F04.S01 01_auction_lifecycle](01_auction_lifecycle/SPEC.md) — 3 modules
- [F04.S02 02_auction_integrity](02_auction_integrity/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F04` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F07, F09, F10, F11, F12, F13, F15.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.unpublished | F01.S01.M03 | F04.S01.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F04.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M01 | external |
| auctions.auction.extended | F04.S02.M02 | F04.S01.M02 | internal |
| auctions.result.voided | F04.S02.M03 | F04.S01.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M02 | external |
| commerce.deal.opened | F09.S01.M01 | F04.S01.M03 | external |
| commerce.deal.completed | F09.S01.M01 | F04.S01.M03 | external |
| commerce.deal.cancelled | F09.S01.M01 | F04.S01.M03 | external |
| commerce.payment.expired | F09.S01.M01 | F04.S01.M03 | external |
| auctions.result.voided | F04.S02.M03 | F04.S01.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F04.S01.M03 | external |
| auctions.bid.placed | F04.S01.M02 | F04.S02.M01 | internal |
| auctions.bid.outbid | F04.S01.M02 | F04.S02.M01 | internal |
| auctions.bid.retracted | F04.S01.M02 | F04.S02.M01 | internal |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M01 | internal |
| auctions.auction.won | F04.S01.M03 | F04.S02.M01 | internal |
| auctions.auction.scheduled | F04.S01.M01 | F04.S02.M01 | internal |
| identity.attestation.added | F07.S03.M02 | F04.S02.M01 | external |
| identity.attestation.revoked | F07.S03.M02 | F04.S02.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F04.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M01 | external |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M02 | external |
| moderation.report.received | F12.S01.M01 | F04.S02.M03 | external |
| auctions.result.non_payment | F04.S01.M03 | F04.S02.M03 | internal |
| auctions.auction.closed | F04.S01.M03 | F04.S02.M03 | internal |
| bazaar.listing.edited | F01.S01.M02 | F04.S02.M03 | external |
| moderation.appeal.decided | F12.S01.M03 | F04.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F04.S02.M03 | external |
