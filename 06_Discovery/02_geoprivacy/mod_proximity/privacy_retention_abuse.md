# PS-049-07 — Privacy, retention and abuse: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-07.R01** The center cell is the only location a relay learns from a query; it is L2 or coarser and is not stored beyond 24 hours in hashed counters.
- **PS-049-07.R02** Result distance is bucketed and computed cell to cell, ordering never uses a finer distance than the bucket, and results contain no coordinates.
- **PS-049-07.R03** Trilateration resistance rests on snapping and bucketing; rate limits are a secondary speed bump, and the spec states that a patient attacker with many keys and networks is slowed, not stopped.

## Specification

**Data classification**
- Query: center cell (L2 at most), radius, filters; counters hashed with a daily rotating salt; no IP beyond /24.
- Results: P0 fields only; no coordinates; distance bucket labels.

**Retention**
- Relay counters RET-EPHEMERAL (24 h); no query log with center cells beyond 24 h; vault keeps no proximity history.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Trilateration by moving the query center and observing bucket edges (Polakis et al. 2015) | centers and documents are cells, so every point in a cell gives identical answers; bucket edges are cell-to-cell, so edges expose only cell-level facts already public at L2 |
| T02 | Probing with many distinct centers to localize a seller within a cell neighbourhood | 2 new centers per hour and 5 per 24 h per caller key, IP /24 and token; relay policy may lower these |
| T03 | Tiny radius to isolate individual listings | minimum radius 5 km, anonymous minimum 25 km at L1 centers, allowed radius set only |
| T04 | Distance ordering leaks finer distance than the bucket | results sorted by bucket then relevance; ties never broken by true distance |
| T05 | Many sybil keys and IPs defeat per-key limits | honest limit - per-key, token and /24 limits only slow this; the bound on leakage remains the L2 cell; relays may add proof-of-work or allowlists by policy |

**Abuse controls**
- Relay policy limits listed above, configurable per relay; exceeding returns RATE_LIMITED with reason and retryAfterMs.
- Pattern detector flags more than 8 queries in 1 hour touching at least 4 distinct centers within 25 km of each other; the relay logs a local signal and may tighten the caller's quota to half for 24 h.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | byte-identical responses; no numeric distance appears in any response |
| TEST-PS-049-09.T04 | abuse | PS-049-07.R03, PS-049-07.R01 | scripted trilateration - 200 centers moving in 100 m steps around a target listing | information obtained is the target's L2 cell and bucket edges only; later queries are RATE_LIMITED |
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03, PS-049-07.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T12 | abuse | PS-049-07.R03, PS-049-08.R03 | pattern of 9 queries over 4 centers within 25 km in an hour | local signal raised and quota halved for 24 h |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
