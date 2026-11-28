# PS-049-09 — Contract and acceptance tests: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-09.R01** Every requirement is covered by at least one automated test, including a property test that results depend only on cells.
- **PS-049-09.R02** Abuse tests simulate a trilateration attempt and verify the information bound and the limits.
- **PS-049-09.R03** Contract tests check the query signature against the registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Index of 2 000 documents over 40 L2 and 5 L1 cells, 10 percent promoted, one blocked author, relay with default RatePolicy rows and settings, anonymous and token callers, IPv4 192.0.2.10 and IPv6 2001:db8:1:1::5, fake RateLimitPort and SignalPort, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 compiled by F06.S01.M03 is used, items carry distance buckets only |
| TEST-PS-049-09.T02 | unit | PS-049-02.R02, PS-049-02.R03 | radius 1 km, radius 7 km, 6-character center, missing center, anonymous at L2 center | DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED, DISCOVERY_CENTER_TOO_PRECISE; no index read and no counter revealed |
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | the items arrays are byte-identical (cursors and areaChangesRemaining excluded); no numeric distance appears in any response |
| TEST-PS-049-09.T04 | abuse | PS-049-07.R03, PS-049-07.R01 | scripted trilateration - 200 centers moving in 100 m steps around a target listing | information obtained is the target's public cell and bucket edges only; later queries are RATE_LIMITED |
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T06 | abuse | PS-049-02.R02, PS-049-03.R02 | 21 queries in one minute as anonymous, 61 as token caller | 21st and 61st RATE_LIMITED with reason per_minute |
| TEST-PS-049-09.T07 | contract | PS-049-04.R01, PS-049-04.R02, PS-049-09.R02 | query executes | output validates against registry schema, contains only P0 fields and the identity fields authorDid, sourceKind, sourceId, sourceRevision, projectionCid, promoted, provenance |
| TEST-PS-049-09.T08 | abuse | PS-049-05.R01, PS-049-05.R02, PS-049-05.R03 | locked vault queries locally; operator tries special access on relay; anonymous at a relay with anonymousAllowed false | UNAUTHENTICATED until unlock; operator has no extra power; anonymous gets FORBIDDEN |
| TEST-PS-049-09.T09 | chaos | PS-049-06.R01, PS-049-06.R02, PS-049-06.R03 | limiter store down; index read fails after increment; same Idempotency-Key with the same body and with a different center; IPv6 caller rotating /64 addresses inside one /48; 24 h window spanning a salt rotation; cursor reused for a wider radius | query classes fall back to half rate and center_new fails closed with RATE_LIMITED for 30 s; no double count for the same body; different center counted and IDEMPOTENCY_KEY_REUSED; one /48 bucket; window still counts after rotation; cursor rejected |
| TEST-PS-049-09.T10 | integration | PS-049-01.R01, PS-049-05.R01 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |
| TEST-PS-049-09.T11 | load | PS-049-08.R01, PS-049-08.R02, PS-049-08.R03 | 50 req/s for 5 minutes on a relay and 120 ms local budget run | relay p95 <= 200 ms, RateLimitPort adds <= 3 ms, metrics exported by reason |
| TEST-PS-049-09.T12 | abuse | PS-049-07.R03, PS-049-08.R03 | pattern of 9 queries over 4 centers within 25 km in an hour | proximity_pattern signal recorded and the caller's query budget halved for 24 h |
| TEST-PS-049-09.T13 | unit | PS-049-09.R01, PS-049-09.R03 | traceability run over PS-049 | every requirement maps to a passing test |
| TEST-PS-049-09.T14 | integration | PS-049-10.R01, PS-049-10.R02, PS-049-10.R03 | export and restore of vault and relay | no proximity data exists in exports; RatePolicy rows and relay settings restored from relay configuration backup; buckets not restored |
| TEST-PS-049-09.T15 | unit | PS-049-01.R02, PS-049-03.R01 | read RatePolicy rows of the proximity classes and inspect RateLimitPort keys | policy versioned; keys pseudonymised, derived from access-token id or IP prefix and never from a device-key thumbprint; buckets expire in 24 h |
| TEST-PS-049-09.T16 | integration | PS-049-04.R03 | trigger the pattern detector | F12.S03.M02 SignalPort.record called once with kind proximity_pattern; no catalog event emitted; metric pattern incremented |
| TEST-PS-049-09.T17 | integration | PS-049-04.R02, PS-049-04.R04 | relay page with 6 promoted items of 20, an item of a blocked author, and an item with a forged title | page reranked to at most 4 promoted, each with promoted true and the discovery.explain.promoted key; the blocked author's item and the forged item never reach the display |
| TEST-PS-049-09.T18 | abuse | PS-049-02.R04, PS-049-07.R04 | token caller alternates discovery.proximity.search, discovery.search.query near and filters.distanceKm with new centers | the third new center in an hour is RATE_LIMITED with reason center_changes on whichever endpoint; per-minute counts are shared across endpoints |
| TEST-PS-049-09.T19 | integration | PS-049-07.R01 | publicLevel L1 and no center; publicLevel L0 and no center; a 5-character center while publicLevel is L1 without and with confirmation | relay request carries the 4-character cell; DISCOVERY_CENTER_REQUIRED until a browse cell is chosen; PRECONDITION_FAILED, then sent after confirmation |
| TEST-PS-049-09.T20 | unit | PS-049-01.R03 | inspect items for L1 and L2 documents | each item exposes a bucket and its public cell of 4 or 5 characters plus identity fields, never a number or a finer cell |

## Acceptance criteria

- All tests T01-T20 pass in CI.
- Same-cell invariance holds (property test) and no response contains a numeric distance or coordinates.
- The scripted trilateration test yields no information finer than the public cell and is rate limited as documented, whichever endpoint carries the center.

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
