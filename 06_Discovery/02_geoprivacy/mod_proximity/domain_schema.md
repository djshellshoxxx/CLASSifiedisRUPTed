# PS-049-01 — Domain schema: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-01.R01** The module owns no persisted entity; its inputs are a center cell, a radius and filters, its limits are F12.S03.M03 RatePolicy rows of the shared proximity budget plus F15.S04.M03 relay settings, and its counters are RET-EPHEMERAL RateLimitPort buckets.
- **PS-049-01.R02** The policy row holds numeric limits per caller class and is versioned so operators can audit changes.
- **PS-049-01.R03** A result item exposes a distance bucket, the document's public cell and the public identity fields shared with F06.S01.M02 items, never a number or a finer location.

## Specification

**Note:** Module owns no entity. Shared proximity budget v1 (the single definition referenced by F06.S01.M02 and recorded as F12.S03.M03 RatePolicy rows) - class read.proximity.query.anonymous 20 per minute and 200 per hour per caller key; class read.proximity.query.token 60 per minute and 600 per hour per caller key; class read.proximity.center_new 2 distinct new centers per hour and 5 per 24 h per caller key; IP prefix limits are the F12.S03.M03 prefix multiplier times the actor limit. Caller key - the per-relay access-token id for token or signed-request callers (never a device-key thumbprint), and the IP prefix (/24 IPv4, /48 IPv6) for every caller. Distinct-center detection - a RateLimitPort probe in class read.proximity.center_seen keyed by (caller key, center cell) with capacity 1 per 24 h; an allowed probe means a new center and costs 1 in read.proximity.center_new, a denied probe means a known center and costs nothing. Relay settings in F15.S04.M03 tenant limits - anonymousAllowed (default true), anonymousMinRadiusKm 25, anonymousCenterLevel L1, maxDepth 500. The anonymous L1 and 25 km default is a scraping-cost and load control, not a location-privacy control, because every result already carries its public cell and buckets are computed from stored cells only.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 compiled by F06.S01.M03 is used, items carry distance buckets only |
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | the items arrays are byte-identical (cursors and areaChangesRemaining excluded); no numeric distance appears in any response |
| TEST-PS-049-09.T10 | integration | PS-049-01.R01, PS-049-05.R01 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |
| TEST-PS-049-09.T15 | unit | PS-049-01.R02, PS-049-03.R01 | read RatePolicy rows of the proximity classes and inspect RateLimitPort keys | policy versioned; keys pseudonymised, derived from access-token id or IP prefix and never from a device-key thumbprint; buckets expire in 24 h |
| TEST-PS-049-09.T20 | unit | PS-049-01.R03 | inspect items for L1 and L2 documents | each item exposes a bucket and its public cell of 4 or 5 characters plus identity fields, never a number or a finer cell |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
