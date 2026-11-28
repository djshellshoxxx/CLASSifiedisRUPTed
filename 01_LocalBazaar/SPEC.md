# F01 — LocalBazaar classifieds

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `bazaar`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F01.S01 01_listings](01_listings/SPEC.md) — 4 modules
- [F01.S02 02_listing_types](02_listing_types/SPEC.md) — 3 modules
- [F01.S03 03_inventory](03_inventory/SPEC.md) — 2 modules
- [F01.S04 04_pricing](04_pricing/SPEC.md) — 2 modules

## Aggregation

The feature is enabled by flag `F01` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F06, F07, F08, F09, F10, F11, F12, F15, F16, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.record.accepted | F11.S01.M02 | F01.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S01.M02 | external |
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
| bazaar.inventory.depleted | F01.S03.M01 | F01.S01.M04 | internal |
| bazaar.inventory.restocked | F01.S03.M01 | F01.S01.M04 | internal |
| privacy.deletion.requested | F10.S01.M04 | F01.S01.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S01.M04 | external |
| bazaar.listing.deleted | F01.S01.M01 | F01.S02.M01 | internal |
| bazaar.listing.published | F01.S01.M03 | F01.S02.M02 | internal |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S02.M02 | internal |
| bazaar.listing.expired | F01.S01.M04 | F01.S02.M02 | internal |
| bazaar.listing.closed | F01.S01.M04 | F01.S02.M02 | internal |
| bazaar.listing.archived | F01.S01.M04 | F01.S02.M02 | internal |
| bazaar.listing.deleted | F01.S01.M01 | F01.S02.M02 | internal |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S02.M03 | internal |
| bazaar.listing.expired | F01.S01.M04 | F01.S02.M03 | internal |
| bazaar.listing.closed | F01.S01.M04 | F01.S02.M03 | internal |
| identity.block.added | F07.S02.M02 | F01.S02.M03 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S02.M03 | external |
| bazaar.listing.created | F01.S01.M01 | F01.S03.M01 | internal |
| bazaar.listing.archived | F01.S01.M04 | F01.S03.M01 | internal |
| bazaar.listing.deleted | F01.S01.M01 | F01.S03.M01 | internal |
| commerce.deal.completed | F09.S01.M01 | F01.S03.M01 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S03.M01 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S03.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S03.M01 | external |
| bazaar.listing.deleted | F01.S01.M01 | F01.S03.M02 | internal |
| bazaar.listing.edited | F01.S01.M02 | F01.S04.M01 | internal |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S04.M01 | internal |
| bazaar.listing.expired | F01.S01.M04 | F01.S04.M01 | internal |
| bazaar.listing.closed | F01.S01.M04 | F01.S04.M01 | internal |
| bazaar.inventory.depleted | F01.S03.M01 | F01.S04.M01 | internal |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F01.S04.M01 | internal |
| identity.block.added | F07.S02.M02 | F01.S04.M01 | external |
| federation.record.accepted | F11.S01.M02 | F01.S04.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S04.M01 | external |
| comms.consent.received | F08.S02.M02 | F01.S04.M01 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S04.M01 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S04.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S04.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S04.M01 | external |
| bazaar.listing.edited | F01.S01.M02 | F01.S04.M02 | internal |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S04.M02 | internal |
| bazaar.listing.expired | F01.S01.M04 | F01.S04.M02 | internal |
| bazaar.listing.closed | F01.S01.M04 | F01.S04.M02 | internal |
| bazaar.inventory.depleted | F01.S03.M01 | F01.S04.M02 | internal |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F01.S04.M02 | internal |
| identity.block.added | F07.S02.M02 | F01.S04.M02 | external |
| federation.record.accepted | F11.S01.M02 | F01.S04.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S04.M02 | external |
| comms.consent.received | F08.S02.M02 | F01.S04.M02 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S04.M02 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S04.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S04.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S04.M02 | external |
