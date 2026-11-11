# PS-049-02 — Validation rules: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-02.R01** Center, radius and depth are validated before any search work is done.
- **PS-049-02.R02** Budget limits are checked through RateLimitPort before the index is touched and failures return RATE_LIMITED with retryAfterMs and a reason.
- **PS-049-02.R03** Validation errors never reveal counters or other users' behaviour.
- **PS-049-02.R04** Every relay request with a center - discovery.proximity.search, and discovery.search.query with near or filters.distanceKm - passes the same center, radius and budget checks.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | center cell has 4 or 5 characters for the vault, members and token callers, and exactly 4 characters for anonymous relay callers | DISCOVERY_CENTER_TOO_PRECISE |
| V02 | radiusKm is at least 5 km, and at least 25 km for anonymous relay callers | DISCOVERY_RADIUS_TOO_SMALL |
| V03 | a center is supplied, or the vault can derive one from a stored home cell at a public level of L1 or L2 | DISCOVERY_CENTER_REQUIRED |
| V04 | relay only - RateLimitPort class read.proximity.center_new allows the request when the center is new for the caller key (at most 2 per hour and 5 per 24 h) | RATE_LIMITED |
| V05 | relay only - RateLimitPort class read.proximity.query.anonymous or read.proximity.query.token allows the request (20 or 60 per minute, 200 or 600 per hour) | RATE_LIMITED |
| V06 | requested depth is at most 500 results and limit is 1..50 | VALIDATION_FAILED |
| V07 | radiusKm is one of the allowed radii 5, 10, 25, 50, 100 | DISCOVERY_RADIUS_NOT_ALLOWED |
| V08 | filters pass F06.S01.M03 validation | DISCOVERY_FILTER_INVALID |
| V09 | vault only - a relay center finer than the user's publicLevel is sent only with confirmFinerCenter true after the UI stated what the relay learns | PRECONDITION_FAILED |
| V10 | relay only - a request with a known Idempotency-Key is deduplicated only when its request hash (center, radius, filters, cursor) matches; otherwise it is counted and refused | IDEMPOTENCY_KEY_REUSED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 compiled by F06.S01.M03 is used, items carry distance buckets only |
| TEST-PS-049-09.T02 | unit | PS-049-02.R02, PS-049-02.R03 | radius 1 km, radius 7 km, 6-character center, missing center, anonymous at L2 center | DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED, DISCOVERY_CENTER_TOO_PRECISE; no index read and no counter revealed |
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T06 | abuse | PS-049-02.R02, PS-049-03.R02 | 21 queries in one minute as anonymous, 61 as token caller | 21st and 61st RATE_LIMITED with reason per_minute |
| TEST-PS-049-09.T18 | abuse | PS-049-02.R04, PS-049-07.R04 | token caller alternates discovery.proximity.search, discovery.search.query near and filters.distanceKm with new centers | the third new center in an hour is RATE_LIMITED with reason center_changes on whichever endpoint; per-minute counts are shared across endpoints |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
