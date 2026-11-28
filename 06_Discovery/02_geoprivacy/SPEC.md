# F06.S02 — 02_geoprivacy

**Status:** SPECIFIED. **Parent:** [F06](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F06.S02.M01 | [Coarse location regions](mod_coarse/SPEC.md) | SPECIFIED | Pure geohash encode/decode/neighbors, snapping to L1/L2/L3 cells, cell-to-cell distance buckets (CTR-PRV-001). |
| F06.S02.M02 | [User location settings](mod_location/SPEC.md) | SPECIFIED | User home region (L2 public), optional manual entry without GPS permission, exact location shares to one counterparty with TTL ≤ 24 h (L4, P3). |
| F06.S02.M03 | [Proximity queries](mod_proximity/SPEC.md) | SPECIFIED | Radius search over cells (min 5 km) with bucketed distances and per-actor rate limits against trilateration. |

## Aggregation

Modules in this subfeature share the feature package `packages/discovery` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.record.accepted | F11.S01.M02 | F06.S02.M02 | external |
| identity.block.added | F07.S02.M02 | F06.S02.M02 | external |
| comms.meetup.cancelled | F08.S03.M03 | F06.S02.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F06.S02.M02 | external |
| commerce.deal.completed | F09.S01.M01 | F06.S02.M02 | external |
| comms.thread.archived | F08.S01.M02 | F06.S02.M02 | external |
| privacy.deletion.requested | F10.S01.M04 | F06.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F06.S02.M02 | external |
