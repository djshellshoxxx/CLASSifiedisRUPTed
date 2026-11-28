# F03 — Services marketplace

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `services`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F03.S01 01_service_catalog](01_service_catalog/SPEC.md) — 2 modules
- [F03.S02 02_service_booking](02_service_booking/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F03` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F06, F07, F08, F09, F10, F11, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.unpublished | F01.S01.M03 | F03.S01.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F03.S01.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F03.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S01.M01 | external |
| services.quote.declined | F03.S02.M01 | F03.S01.M02 | internal |
| services.quote.expired | F03.S02.M01 | F03.S01.M02 | internal |
| services.booking.cancelled | F03.S02.M01 | F03.S01.M02 | internal |
| identity.block.added | F07.S02.M02 | F03.S01.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F03.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S01.M02 | external |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M01 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M01 | external |
| identity.block.added | F07.S02.M02 | F03.S02.M01 | external |
| services.offering.withdrawn | F03.S01.M01 | F03.S02.M01 | internal |
| services.availability.changed | F03.S01.M02 | F03.S02.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M01 | external |
| commerce.payment.claimed | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.confirming | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.confirmed | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.finalized | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.reorged | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.failed | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.disputed | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.expired | F09.S01.M01 | F03.S02.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F03.S02.M02 | external |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M02 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M02 | external |
| commerce.dispute.opened | F09.S02.M02 | F03.S02.M03 | external |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M03 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M03 | external |
