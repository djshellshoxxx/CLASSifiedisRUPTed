# PS-049-09 — Contract and acceptance tests: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-09.R01** Every requirement is covered by at least one automated test, including a property test that results depend only on cells.
- **PS-049-09.R02** Abuse tests simulate a trilateration attempt and verify the information bound and the limits.
- **PS-049-09.R03** Contract tests check the query signature against the registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Index of 2 000 documents over 40 L2 cells, relay with default policy, anonymous and token callers, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 used, items carry distance buckets only |
| TEST-PS-049-09.T02 | unit | PS-049-02.R02, PS-049-02.R03, PS-049-06.R01 | radius 1 km, 6-character center, missing center, anonymous at L2 center | DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED respectively; no index read |
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | byte-identical responses; no numeric distance appears in any response |
| TEST-PS-049-09.T04 | abuse | PS-049-07.R03, PS-049-07.R01 | scripted trilateration - 200 centers moving in 100 m steps around a target listing | information obtained is the target's L2 cell and bucket edges only; later queries are RATE_LIMITED |
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03, PS-049-07.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T06 | abuse | PS-049-02.R02, PS-049-03.R02 | 21 queries in one minute as anonymous, 61 as token caller | 21st and 61st RATE_LIMITED with reason per_minute |
| TEST-PS-049-09.T07 | contract | PS-049-04.R01, PS-049-04.R02, PS-049-09.R02 | query executes | output validates against registry schema and contains only P0 fields |
| TEST-PS-049-09.T08 | abuse | PS-049-05.R01, PS-049-05.R02, PS-049-05.R03 | locked vault queries locally; operator tries special access on relay; anonymous at disabled-anonymous relay | local needs unlock; operator has no extra power; anonymous gets FORBIDDEN |
| TEST-PS-049-09.T09 | chaos | PS-049-06.R01, PS-049-06.R02, PS-049-06.R03 | counter store down; index read fails after increment; same Idempotency-Key retried | fail closed with DEPENDENCY_UNAVAILABLE; no double count within 60 s; cursor reuse for wider radius rejected |
| TEST-PS-049-09.T10 | integration | PS-049-04.R03, PS-049-01.R02 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |
| TEST-PS-049-09.T11 | load | PS-049-08.R01, PS-049-08.R02, PS-049-08.R03 | 50 req/s for 5 minutes on a relay and 120 ms local budget run | relay p95 <= 200 ms, counters add <= 3 ms, metrics exported by reason |
| TEST-PS-049-09.T12 | abuse | PS-049-07.R03, PS-049-08.R03 | pattern of 9 queries over 4 centers within 25 km in an hour | local signal raised and quota halved for 24 h |
| TEST-PS-049-09.T13 | unit | PS-049-09.R01, PS-049-09.R03 | traceability run over PS-049 | every requirement maps to a passing test |
| TEST-PS-049-09.T14 | integration | PS-049-10.R01, PS-049-10.R02, PS-049-10.R03 | export and restore of vault and relay | no proximity data exists in exports; policy values restored from relay configuration backup |
| TEST-PS-049-09.T15 | unit | PS-049-01.R01, PS-049-03.R01 | read relay policy values and inspect counters storage | policy versioned, counters hashed with rotating salt and expire in 24 h |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Same-cell invariance holds (property test) and no response contains a numeric distance or coordinates.
- The scripted trilateration test yields no information finer than the L2 cell and is rate limited as documented.

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
