# F01.S03 — 03_inventory

**Status:** SPECIFIED. **Parent:** [F01](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F01.S03.M01 | [Inventory availability](mod_availability/SPEC.md) | SPECIFIED | Quantity on hand per listing/variant, holds (leases CTR-IDM-001) for accepted offers and cycle locks, prevents double-commit of the same item across sale and barter. |
| F01.S03.M02 | [Listing variants](mod_variants/SPEC.md) | SPECIFIED | Size/colour/condition variants each with own price and quantity; max 50 per listing. |

## Aggregation

Modules in this subfeature share the feature package `packages/bazaar` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.created | F01.S01.M01 | F01.S03.M01 | external |
| bazaar.listing.archived | F01.S01.M04 | F01.S03.M01 | external |
| bazaar.listing.deleted | F01.S01.M01 | F01.S03.M01 | external |
| bazaar.variant.changed | F01.S03.M02 | F01.S03.M01 | internal |
| commerce.deal.completed | F09.S01.M01 | F01.S03.M01 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S03.M01 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S03.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S03.M01 | external |
| bazaar.listing.deleted | F01.S01.M01 | F01.S03.M02 | external |
