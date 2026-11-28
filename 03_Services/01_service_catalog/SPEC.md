# F03.S01 — 01_service_catalog

**Status:** SPECIFIED. **Parent:** [F03](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F03.S01.M01 | [Service skills catalog](mod_skills/SPEC.md) | SPECIFIED | Service offerings: skill taxonomy, rate (hourly/fixed Money), service area as L1/L2 region, credentials as self-attested claims. |
| F03.S01.M02 | [Service availability](mod_availability/SPEC.md) | SPECIFIED | Weekly recurring slots + exceptions in provider time zone; slot holds during quote acceptance. |

## Aggregation

Modules in this subfeature share the feature package `packages/services` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.unpublished | F01.S01.M03 | F03.S01.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F03.S01.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F03.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S01.M01 | external |
| services.quote.declined | F03.S02.M01 | F03.S01.M02 | external |
| services.quote.expired | F03.S02.M01 | F03.S01.M02 | external |
| services.booking.cancelled | F03.S02.M01 | F03.S01.M02 | external |
| identity.block.added | F07.S02.M02 | F03.S01.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F03.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S01.M02 | external |
