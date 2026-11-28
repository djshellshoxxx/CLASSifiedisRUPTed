# F01.S01 — 01_listings

**Status:** SPECIFIED. **Parent:** [F01](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F01.S01.M01 | [Listing creation](mod_create/SPEC.md) | SPECIFIED | Create draft listings (sell/wanted/giveaway/service/rental/auction subtype ref), media refs, category, coarse region; drafts are device+relay P3 until published. |
| F01.S01.M02 | [Listing editing](mod_edit/SPEC.md) | SPECIFIED | Revise draft or published listings with optimistic concurrency, material-change detection (price/condition/category) that invalidates open offers' assumptions and notifies offerers. |
| F01.S01.M03 | [Listing publication](mod_publish/SPEC.md) | SPECIFIED | Publish/unpublish after policy checks (F18 prohibited goods, F12 spam/risk), set expiry (default 30 days), optional paid promotion via merchant fee claim, federation opt-in flag. |
| F01.S01.M04 | [Listing archive and expiry](mod_archive/SPEC.md) | SPECIFIED | Expire, archive, restore (within 90 days) and mark sold/given/traded; stale inventory sweeps; removal from search via events. |

## Aggregation

Modules in this subfeature share the feature package `packages/bazaar` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.published | F01.S01.M03 | F01.S01.M02 | internal |
| bazaar.publication.renewed | F01.S01.M03 | F01.S01.M02 | internal |
| bazaar.listing.deleted | F01.S01.M01 | F01.S01.M02 | internal |
| federation.record.accepted | F11.S01.M02 | F01.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S01.M02 | external |
| bazaar.listing.expired | F01.S01.M04 | F01.S01.M03 | internal |
| governance.prohibited_rule.changed | F18.S01.M02 | F01.S01.M03 | external |
| governance.category.changed | F18.S01.M03 | F01.S01.M03 | external |
| commerce.payment.claimed | F09.S01.M01 | F01.S01.M03 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F01.S01.M03 | external |
| commerce.payment.finalized | F09.S01.M03 | F01.S01.M03 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S01.M03 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S01.M03 | external |
| commerce.payment.reorged | F09.S01.M03 | F01.S01.M03 | external |
| commerce.payment.expired | F09.S01.M01 | F01.S01.M03 | external |
| commerce.payment.failed | F09.S01.M03 | F01.S01.M03 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S01.M03 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F01.S01.M04 | external |
| bazaar.inventory.restocked | F01.S03.M01 | F01.S01.M04 | external |
| bazaar.listing.published | F01.S01.M03 | F01.S01.M04 | internal |
| privacy.deletion.requested | F10.S01.M04 | F01.S01.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S01.M04 | external |
