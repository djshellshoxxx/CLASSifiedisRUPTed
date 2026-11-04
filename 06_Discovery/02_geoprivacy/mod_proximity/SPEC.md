# F06.S02.M03 — Proximity queries

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S02](../SPEC.md). **Process IDs:** PS-049-01…PS-049-10. **Code:** `packages/discovery/src/geoprivacy/proximity`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Radius search over cells with bucketed distances. Locally in the vault it filters the local index by cell sets with no limits, because the user already holds that data. On a relay it is served as the query discovery.proximity.search under relay-policy rate limits designed against trilateration (Polakis et al., CCS 2015): the search center is always a cell (never a raw point), the radius is at least 5 km, distances leave the module only as bucket labels, and the number of distinct centers per client is limited. Cell snapping bounds what any attacker can learn to the L2 cell that is already public; rate limits slow cross-referencing, they do not claim to stop it.

## Responsibilities

- Resolve a search area from a center cell (own home cell or a chosen browse cell) and a radius from the set 5, 10, 25, 50, 100 km using F06.S02.M01.
- Return documents inside the cell set with a distance bucket per item computed cell-to-cell, never a numeric distance, and order by bucket then relevance score.
- On a relay, enforce policy limits on query rate, distinct centers and radius for anonymous and token callers, and record abuse patterns in relay-local counters.
- Provide library guards (assertCenterCell, assertRadius, bucketize) used by F06.S01.M02 when the near parameter is present.

## Not responsible for

- Geohash math and bucket thresholds (F06.S02.M01).
- Full-text queries and saved searches (F06.S01.M02) and scoring (F06.S03).
- Global user suspension or global rate limits; limits are per relay policy (CAP-9) and the vault has none.
- Future: per-query differential-privacy noise on result counts, proof-of-work tickets for anonymous callers, cross-relay shared abuse signals.

## User stories

- As a buyer, I browse items within 10 km of my area and see '5-10 km' badges, not exact distances.
- As a buyer on a relay, I can change my browse area a few times per day but not hundreds of times.
- As a seller, my listing cannot be located more precisely than my approximate area by repeated proximity queries.
- As a relay operator, I can tune the limits and see when they trigger, without learning anyone's home location.

## Edge cases

- Radius 1 km is requested; rejected with DISCOVERY_RADIUS_TOO_SMALL, never rounded up silently.
- A caller supplies a 6-character center cell; rejected with DISCOVERY_CENTER_TOO_PRECISE and nothing is queried.
- A caller issues queries from 12 distinct centers within an hour on a relay; the 3rd distinct new center in an hour and the 6th in 24 h get RATE_LIMITED with reason center_changes.
- Two points in the same cell issue the same query; responses are identical, proving no sub-cell information is used.
- A caller omits the center and has no stored home cell; DISCOVERY_CENTER_REQUIRED.
- A radius search would return 0 documents; an empty result is returned and still counts toward limits.
- An anonymous caller requests radius 5 km at an L2 center; the relay policy forces anonymous callers to L1 centers and radius at least 25 km, returning DISCOVERY_CENTER_TOO_PRECISE otherwise.
- The vault is offline; local proximity search works without limits.

## UX and accessibility

- Nearby screen: area label ('Around <region>'), radius selector (5, 10, 25, 50, 100 km), results grouped by distance bucket badges, 'Change area' action showing remaining area changes today when on a relay.

**States:** loading; empty; results; rate-limited; offline-local-only; error

**Accessibility:** Distance buckets are text badges with accessible names such as 'between 5 and 10 kilometres away'.; The radius selector is a native radio group with 44 by 44 px targets.; A rate-limited state is announced via aria-live polite with the retry time.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `discovery.proximity.search`
- Emits: none
- Consumes: none

## Dependencies

F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-049-01 | [Domain schema](domain_schema.md) | 3 |
| PS-049-02 | [Validation rules](validation_rules.md) | 3 |
| PS-049-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-049-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-049-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-049-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-049-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-049-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-049-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-049-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/geoprivacy/proximity/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Same-cell invariance holds (property test) and no response contains a numeric distance or coordinates.
- The scripted trilateration test yields no information finer than the L2 cell and is rate limited as documented.
