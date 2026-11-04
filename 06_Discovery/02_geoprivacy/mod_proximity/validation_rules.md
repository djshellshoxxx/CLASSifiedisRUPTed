# PS-049-02 — Validation rules: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-02.R01** Center, radius and depth are validated before any search work is done.
- **PS-049-02.R02** Relay policy limits are checked before the index is touched and failures return RATE_LIMITED with retryAfterMs and a reason.
- **PS-049-02.R03** Validation errors never reveal counters or other users' behaviour.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | center cell has exactly 5 characters (members and tokens) or 4 characters (anonymous relay callers) | DISCOVERY_CENTER_TOO_PRECISE |
| V02 | radiusKm is one of 5, 10, 25, 50, 100 and at least 25 for anonymous relay callers | DISCOVERY_RADIUS_TOO_SMALL |
| V03 | a center is supplied or the vault has a stored home cell | DISCOVERY_CENTER_REQUIRED |
| V04 | relay only - distinct new centers within 1 h are at most 2 and within 24 h at most 5 per caller key | RATE_LIMITED |
| V05 | relay only - queries within 1 minute are at most 20 (anonymous) or 60 (token) and within 1 hour at most 200 or 600 | RATE_LIMITED |
| V06 | requested depth is at most 500 results and limit is 1..50 | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 used, items carry distance buckets only |
| TEST-PS-049-09.T02 | unit | PS-049-02.R02, PS-049-02.R03, PS-049-06.R01 | radius 1 km, 6-character center, missing center, anonymous at L2 center | DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED respectively; no index read |
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03, PS-049-07.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T06 | abuse | PS-049-02.R02, PS-049-03.R02 | 21 queries in one minute as anonymous, 61 as token caller | 21st and 61st RATE_LIMITED with reason per_minute |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
