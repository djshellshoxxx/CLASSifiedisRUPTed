# PS-049-01 — Domain schema: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-01.R01** The module owns no persisted entity; its inputs are a center cell, a radius and filters, and its limits are relay policy values with counters held in RET-EPHEMERAL relay memory.
- **PS-049-01.R02** The policy row holds numeric limits per caller class and is versioned so operators can audit changes.
- **PS-049-01.R03** A result item exposes a distance bucket and the document's L2 cell only, never a number or a finer location.

## Specification

**Note:** Module owns no entity. Relay policy values (stored in relay configuration by F15.S04, read here) - anonymousMinRadiusKm 25, anonymousCenterLevel L1, queriesPerMinute 20 (anonymous) and 60 (token), queriesPerHour 200 (anonymous) and 600 (token), distinctCentersPerHour 2, distinctCentersPer24h 5, maxDepth 500. Counters (RET-EPHEMERAL, 24 h) are keyed by device-key thumbprint, access-token id and IP /24 and stored hashed with a rotating daily salt.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T01 | unit | PS-049-01.R01, PS-049-02.R01 | valid center and radius 10 | cell set from F06.S02.M01 used, items carry distance buckets only |
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | byte-identical responses; no numeric distance appears in any response |
| TEST-PS-049-09.T10 | integration | PS-049-04.R03, PS-049-01.R02 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |
| TEST-PS-049-09.T15 | unit | PS-049-01.R01, PS-049-03.R01 | read relay policy values and inspect counters storage | policy versioned, counters hashed with rotating salt and expire in 24 h |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
