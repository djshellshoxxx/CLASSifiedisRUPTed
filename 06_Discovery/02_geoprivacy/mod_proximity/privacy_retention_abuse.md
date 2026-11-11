# PS-049-07 — Privacy, retention and abuse: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-07.R01** The center cell is the only location a relay learns from a query; it is L2 or coarser, defaults to the user's public level (never the private home cell at a finer level), and is kept no longer than 24 hours in pseudonymised counters keyed by access token or IP prefix, never by a long-lived device key.
- **PS-049-07.R02** Result distance is bucketed and computed cell to cell, ordering never uses a finer distance than the bucket, and results contain no coordinates.
- **PS-049-07.R03** Trilateration resistance rests on snapping and bucketing; rate limits are a secondary speed bump, and the spec states that a patient attacker with many keys and networks is slowed, not stopped.
- **PS-049-07.R04** Limits run through RateLimitPort (F12.S03.M03, PRV-2, N18) with one set of numbers shared by every relay request with a center; counter keys are HMAC pseudonyms that protect against log readers and backups, not against the relay operator who holds the salt.

## Specification

**Data classification**
- Query: center cell (L2 at most, by default the user's public level), radius, filters; counter keys are pseudonymised per F12.S03.M03; IPs only as /24 (IPv4) or /48 (IPv6) prefixes.
- Results: P0 fields only; no coordinates; distance bucket labels.

**Retention**
- RateLimitPort buckets RET-EPHEMERAL (24 h); no query log with center cells beyond 24 h; vault keeps no proximity history.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Trilateration by moving the query center and observing bucket edges (Polakis et al. 2015) | centers and documents are cells, so every point in a cell gives identical answers; bucket edges are cell-to-cell, so edges expose only cell-level facts already public at the published level |
| T02 | Probing with many distinct centers to localize a seller within a cell neighbourhood | 2 new centers per hour and 5 per 24 h per caller key, shared by every endpoint with a center; relay policy may lower these |
| T03 | Tiny radius to isolate individual listings | minimum radius 5 km, anonymous minimum 25 km at L1 centers, allowed radius set only |
| T04 | Distance ordering leaks finer distance than the bucket | results sorted by bucket then relevance; ties never broken by true distance |
| T05 | Many sybil keys and IPs defeat per-key limits | honest limit - per-token and per-prefix (/24, /48) limits only slow this; the bound on leakage remains the public cell; relays may add proof-of-work or allowlists by policy |
| T06 | Bypass through discovery.search.query near or filters.distanceKm | the same guards and the shared budget apply to every relay request with a center |
| T07 | Counter evasion by reusing an Idempotency-Key with new centers, rotating IPv6 addresses, or waiting for the salt rotation | request-hash check, /48 prefix keys, current and previous salt checked for 24 h |
| T08 | Relay learns the user's private home cell at a finer level than published | default center truncated to publicLevel; L0 requires an explicit browse cell; finer centers need confirmation |
| T09 | Unlabelled promoted placement or blocked authors in proximity results | F06.S03.M02 rerank labels and caps promoted items; the vault re-audits relay pages and applies filterBlocked at display time |

**Abuse controls**
- Shared proximity budget listed above, configurable per relay as RatePolicy rows; exceeding returns RATE_LIMITED with reason (center_changes, per_minute, per_hour, pattern) and retryAfterMs.
- Pattern detector flags more than 8 queries in 1 hour touching at least 4 distinct centers within 25 km of each other; the relay records a proximity_pattern signal through F12.S03.M02 SignalPort.record and halves the caller key's query budget for 24 h through a RateLimitPort penalty.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T03 | property | PS-049-01.R03, PS-049-07.R02 | 1 000 pairs of points in the same cell issue the same query | the items arrays are byte-identical (cursors and areaChangesRemaining excluded); no numeric distance appears in any response |
| TEST-PS-049-09.T04 | abuse | PS-049-07.R03, PS-049-07.R01 | scripted trilateration - 200 centers moving in 100 m steps around a target listing | information obtained is the target's public cell and bucket edges only; later queries are RATE_LIMITED |
| TEST-PS-049-09.T12 | abuse | PS-049-07.R03, PS-049-08.R03 | pattern of 9 queries over 4 centers within 25 km in an hour | proximity_pattern signal recorded and the caller's query budget halved for 24 h |
| TEST-PS-049-09.T18 | abuse | PS-049-02.R04, PS-049-07.R04 | token caller alternates discovery.proximity.search, discovery.search.query near and filters.distanceKm with new centers | the third new center in an hour is RATE_LIMITED with reason center_changes on whichever endpoint; per-minute counts are shared across endpoints |
| TEST-PS-049-09.T19 | integration | PS-049-07.R01 | publicLevel L1 and no center; publicLevel L0 and no center; a 5-character center while publicLevel is L1 without and with confirmation | relay request carries the 4-character cell; DISCOVERY_CENTER_REQUIRED until a browse cell is chosen; PRECONDITION_FAILED, then sent after confirmation |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
