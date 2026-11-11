# PS-049-04 — Commands, queries and events: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-04.R01** The only operation is the query discovery.proximity.search, served by the vault locally and by a relay endpoint; it never writes domain state and never produces statements.
- **PS-049-04.R02** Results contain only public P0 fields of SearchDocuments plus a distance bucket.
- **PS-049-04.R03** The module emits no events; relay-local abuse counters are metrics, and anomaly reports go to the relay's own moderation port.

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.proximity.search` | discovery.proximity_area.search | { centerCell5?: string, radiusKm: 5\|10\|25\|50\|100, filters?, sort?: bucket_then_relevance\|newest, cursor?, limit? (1..50, default 20) } | { items: [{ documentId, title, priceMinor?, currency?, geoCell5?, distanceBucket: lt5\|5_10\|10_25\|25_50\|gt50, explain }], nextCursor?, areaChangesRemaining? } | DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_CENTER_REQUIRED, DISCOVERY_FILTER_INVALID, RATE_LIMITED, EXPIRED |

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_CENTER_TOO_PRECISE | 422 | no | center cell is finer than allowed for this caller |
| DISCOVERY_RADIUS_TOO_SMALL | 422 | no | radius is below 5 km, not an allowed value, or below the anonymous minimum |
| DISCOVERY_CENTER_REQUIRED | 422 | no | no center was supplied and no home cell is stored |
| DISCOVERY_FILTER_INVALID | 422 | no | a filter value is out of range or of the wrong type |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Query-only module with no events; abuse patterns are reported to the relay's local moderation port as signals, not as catalog events.

### Example

```
relay query: POST /api/v1/query/discovery.proximity.search { "centerCell5": "u4pru", "radiusKm": 10, "limit": 20 }
200 { "items": [{ "documentId": "0192f3b0-…", "title": "Trek road bike 56cm", "distanceBucket": "5_10", "geoCell5": "u4prv" }], "areaChangesRemaining": 4 }
429 { "code": "RATE_LIMITED", "retryable": true, "params": { "reason": "center_changes" }, "retryAfterMs": 1800000 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T07 | contract | PS-049-04.R01, PS-049-04.R02, PS-049-09.R02 | query executes | output validates against registry schema and contains only P0 fields |
| TEST-PS-049-09.T10 | integration | PS-049-04.R03, PS-049-01.R02 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
