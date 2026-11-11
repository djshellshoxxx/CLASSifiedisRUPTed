# F06.S02.M03 — Proximity queries

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S02](../SPEC.md). **Process IDs:** PS-049-01…PS-049-10. **Code:** `packages/discovery/src/geoprivacy/proximity`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Radius search over cells with bucketed distances. Locally in the vault it filters the local index by cell sets with no limits, because the user already holds that data. On a relay it is served as the query discovery.proximity.search, and it defines the single shared proximity budget that every relay request carrying a search center consumes - this query, and discovery.search.query with near or filters.distanceKm - through the shared RateLimitPort of F12.S03.M03 (PRV-2, N18). The search center is always a cell (never a raw point), defaults to the user's chosen public level, the radius is at least 5 km, distances leave the module only as bucket labels, and the number of distinct centers per caller is limited. Results carry the same public identity fields as search results, are reranked by F06.S03.M02 so relay-sold promotion is always labelled and capped, and are verified and block-filtered in the vault. Cell snapping bounds what any attacker can learn to the public cell each document already shows; rate limits slow scraping and cross-referencing, they do not claim to stop them.

## Responsibilities

- Resolve a search area from a center cell (for relay queries the home cell truncated to the user's public level, or an explicitly chosen browse cell) and a radius from the set 5, 10, 25, 50, 100 km using F06.S02.M01, compiling the cell set with F06.S01.M03.
- Return documents inside the cell set with a distance bucket per item computed cell-to-cell, never a numeric distance, with the item shape of F06.S01.M02 (authorDid, sourceKind, sourceId, sourceRevision, projectionCid, promoted, provenance), ordered by bucket then relevance and reranked with F06.S03.M02.
- Define the shared proximity budget (per-minute, per-hour and distinct-center limits per caller class) as F12.S03.M03 RatePolicy buckets consumed through RateLimitPort.consume by every relay request with a center, and report abuse patterns to the relay's moderation signal port.
- Provide library guards (assertCenterForCaller, assertRadius, consumeProximityBudget, bucketize) used by F06.S01.M02 whenever near or filters.distanceKm is present.
- In the vault, verify every relay item's signed projection against authorDid, audit relay pages with F06.S03.M02 auditPage, and filter blocked authors (F07.S02.M02 filterBlocked) and locally hidden content (F12.S01.M01) at display time.

## Not responsible for

- Geohash math, bucket thresholds and the geo error codes (F06.S02.M01); filter validation and its codes (F06.S01.M03).
- Full-text queries and saved searches (F06.S01.M02) and scoring (F06.S03).
- The rate-limiter algorithm, bucket storage and key hashing (F12.S03.M03); relay settings storage (F15.S04.M03).
- Global user suspension or global rate limits; limits are per relay policy (CAP-9) and the vault has none.
- Future: per-query differential-privacy noise on result counts, proof-of-work tickets for anonymous callers, cross-relay shared abuse signals.

## User stories

- As a buyer, I browse items within 10 km of my area and see '5-10 km' badges, not exact distances.
- As a buyer on a relay, I can change my browse area a few times per day but not hundreds of times, whichever search screen I use.
- As a buyer whose public level is Region (L1), my vault tells a relay only my 4-character region unless I explicitly choose a finer area.
- As a seller, my listing cannot be located more precisely than the area I published by repeated proximity queries.
- As a buyer, promoted results in nearby search are labelled 'Promoted' and limited to one fifth of a page, and I never see listings from authors I blocked.
- As a relay operator, I can tune the limits and see when they trigger, without learning anyone's home location beyond the centers callers send.

## Edge cases

- Radius 1 km is requested; rejected with DISCOVERY_RADIUS_TOO_SMALL, never rounded up silently; radius 7 km is rejected with DISCOVERY_RADIUS_NOT_ALLOWED.
- A caller supplies a 6-character center cell; rejected with DISCOVERY_CENTER_TOO_PRECISE and nothing is queried.
- A caller issues queries from 12 distinct centers within an hour on a relay, mixing discovery.proximity.search and discovery.search.query near; the 3rd distinct new center in an hour and the 6th in 24 h get RATE_LIMITED with reason center_changes on either endpoint.
- Two points in the same cell issue the same query; the items are identical, proving no sub-cell information is used.
- A caller omits the center and has no stored home cell, or the user's public level is L0; DISCOVERY_CENTER_REQUIRED until a browse cell is chosen.
- The user's public level is L1 and no center is given; the vault sends the 4-character truncation of the home cell to the relay; a finer center needs explicit confirmation.
- A radius search would return 0 documents; an empty result is returned and still counts toward limits.
- An anonymous caller requests radius 5 km at an L2 center; the relay policy forces anonymous callers to L1 centers and radius at least 25 km, returning DISCOVERY_CENTER_TOO_PRECISE otherwise.
- A client retries with the same Idempotency-Key but a different center; it is counted and refused with IDEMPOTENCY_KEY_REUSED.
- An IPv6 caller rotates addresses within its /64; all addresses share one /48 bucket.
- The vault is offline; local proximity search works without limits.

## UX and accessibility

- Nearby screen: area label ('Around <region>'), radius selector (5, 10, 25, 50, 100 km), results grouped by distance bucket badges with 'Promoted' labels, 'Change area' action showing remaining area changes today when on a relay, and a confirmation sheet stating what the relay learns before a center finer than the public level is sent.

**States:** loading; empty; results; rate-limited; offline-local-only; center-needed; error

**Accessibility:** Distance buckets are text badges with accessible names such as 'between 5 and 10 kilometres away'.; The radius selector is a native radio group with 44 by 44 px targets.; A rate-limited state is announced via aria-live polite with the retry time.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `discovery.proximity.search`
- Emits: none
- Consumes: none

## Dependencies

F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-049-01 | [Domain schema](domain_schema.md) | 3 |
| PS-049-02 | [Validation rules](validation_rules.md) | 4 |
| PS-049-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-049-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-049-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-049-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-049-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-049-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-049-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-049-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/geoprivacy/proximity/index.ts`.

## Acceptance criteria

- All tests T01-T20 pass in CI.
- Same-cell invariance holds (property test) and no response contains a numeric distance or coordinates.
- The scripted trilateration test yields no information finer than the public cell and is rate limited as documented, whichever endpoint carries the center.
