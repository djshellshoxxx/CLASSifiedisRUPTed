# F06.S02.M01 — Coarse location regions

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S02](../SPEC.md). **Process IDs:** PS-047-01…PS-047-10. **Code:** `packages/discovery/src/geoprivacy/coarse`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Pure, isomorphic geohash library implementing CTR-PRV-001 location levels. It encodes and decodes geohashes, neighbors, snaps a point to the cell of level L1 (precision 4), L2 (precision 5) or L3 (precision 6), refuses any public use above L2, enumerates the cells covering a search radius (minimum 5 km), and computes cell-to-cell distance buckets. Points are snapped to cells; coordinates are never jittered. It owns no data.

## Responsibilities

- Encode and decode standard geohash (base32 alphabet 0123456789bcdefghjkmnpqrstuvwxyz) and compute the 8 neighbors of a cell.
- Snap a latitude and longitude to an L1, L2 or L3 cell and expose a guard that rejects any public or federated payload cell longer than 5 characters.
- Enumerate cells covering a radius of 5..100 km around a center cell, using precision-5 cells up to 25 km and precision-4 cells above, with a hard cap of 512 cells.
- Compute the distance bucket (lt5, 5_10, 10_25, 25_50, gt50) between two cells from cell-center distance only.

## Not responsible for

- Storing locations and user settings (F06.S02.M02).
- Proximity query policy, rate limits and trilateration controls (F06.S02.M03).
- Reverse geocoding or place names; no external geocoding service is called.
- Future: H3 cells, polygons for administrative regions, cross-antimeridian optimizations beyond the generic wrap handling.

## User stories

- As a user, my device converts my position to an approximate area cell before anything leaves the device.
- As a buyer, I only ever see distances as buckets such as '5-10 km'.
- As a developer, I use one tested library for every geohash operation so no module invents its own precision.

## Edge cases

- Latitude 90 or longitude 180 sits on a cell boundary; encoding clamps to the highest cell and decoding is stable.
- Latitude outside -90..90, longitude outside -180..180 or NaN; rejected with DISCOVERY_COORD_INVALID.
- A search circle crosses the antimeridian or a pole; cell enumeration wraps longitude and clamps latitude, returning each cell once.
- Radius below 5 km (for example 1 km) is requested; rejected with DISCOVERY_RADIUS_TOO_SMALL, never rounded silently.
- A 6-character cell is passed to the public guard; rejected with DISCOVERY_PRECISION_FORBIDDEN.
- A circle would need more than 512 cells; rejected with DISCOVERY_RADIUS_TOO_LARGE instead of truncating.

## UX and accessibility



Library module with no screens. UI strings for buckets come from message keys discovery.bucket.lt5, discovery.bucket.5_10, discovery.bucket.10_25, discovery.bucket.25_50, discovery.bucket.gt50.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-047-01 | [Domain schema](domain_schema.md) | 3 |
| PS-047-02 | [Validation rules](validation_rules.md) | 3 |
| PS-047-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-047-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-047-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-047-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-047-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-047-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-047-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-047-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/geoprivacy/coarse/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI with the published geohash vectors.
- No public function can emit a cell longer than 5 characters or a numeric distance.
- Property tests run 200 times per PR and 10 000 nightly with recorded seeds.
