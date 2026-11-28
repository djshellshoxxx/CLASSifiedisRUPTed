# F01.S04 — 04_pricing

**Status:** SPECIFIED. **Parent:** [F01](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F01.S04.M01 | [Purchase offers](mod_offers/SPEC.md) | SPECIFIED | Buyer offers on sell listings with Money amount, expiry (default 48 h), acceptance creates inventory hold and Deal handoff to F09 settlement. |
| F01.S04.M02 | [Price negotiation](mod_negotiation/SPEC.md) | SPECIFIED | Counteroffer chains (max 10 rounds) between buyer and seller, each revision immutable; closes on accept/reject/expiry. |

## Aggregation

Modules in this subfeature share the feature package `packages/bazaar` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.listing.edited | F01.S01.M02 | F01.S04.M01 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S04.M01 | external |
| bazaar.listing.expired | F01.S01.M04 | F01.S04.M01 | external |
| bazaar.listing.closed | F01.S01.M04 | F01.S04.M01 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F01.S04.M01 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F01.S04.M01 | external |
| identity.block.added | F07.S02.M02 | F01.S04.M01 | external |
| federation.record.accepted | F11.S01.M02 | F01.S04.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S04.M01 | external |
| comms.consent.received | F08.S02.M02 | F01.S04.M01 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S04.M01 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S04.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S04.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S04.M01 | external |
| bazaar.listing.edited | F01.S01.M02 | F01.S04.M02 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F01.S04.M02 | external |
| bazaar.listing.expired | F01.S01.M04 | F01.S04.M02 | external |
| bazaar.listing.closed | F01.S01.M04 | F01.S04.M02 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F01.S04.M02 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F01.S04.M02 | external |
| identity.block.added | F07.S02.M02 | F01.S04.M02 | external |
| federation.record.accepted | F11.S01.M02 | F01.S04.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F01.S04.M02 | external |
| comms.consent.received | F08.S02.M02 | F01.S04.M02 | external |
| federation.conflict.detected | F11.S02.M03 | F01.S04.M02 | external |
| federation.conflict.resolved | F11.S02.M03 | F01.S04.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F01.S04.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F01.S04.M02 | external |
