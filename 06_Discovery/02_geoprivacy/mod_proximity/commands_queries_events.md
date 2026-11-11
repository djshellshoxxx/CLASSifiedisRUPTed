# PS-049-04 — Commands, queries and events: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-04.R01** The only operation is the query discovery.proximity.search, served by the vault locally and by a relay endpoint; it never writes domain state and never produces statements.
- **PS-049-04.R02** Results contain only public P0 fields of SearchDocuments plus a distance bucket, and are reranked with F06.S03.M02 so promoted items carry promoted true and the 'Promoted' explanation key and never exceed floor(20 percent) of a page.
- **PS-049-04.R03** The module emits no events; relay-local abuse counters are metrics, and anomaly reports go to the relay's own moderation signal port.
- **PS-049-04.R04** In the vault, relay items are shown only after their signed projection verifies against authorDid, and blocked or locally hidden authors are filtered at display time.

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.proximity.search` | discovery.proximity_area.search | { centerCell?: string (4 or 5 characters), radiusKm: 5\|10\|25\|50\|100, filters?, sort?: bucket_then_relevance\|newest, cursor?, limit? (1..50, default 20), confirmFinerCenter?: boolean (vault only) } | { items: [{ documentId, sourceKind, sourceId, sourceRevision, projectionCid, authorDid, title, priceMinor?, currency?, geoCell?, distanceBucket: lt5\|5_10\|10_25\|25_50\|gt50, promoted, promotedBy?, explain, provenance, envelope? (relay responses: signed projection for vault verification) }], nextCursor?, areaChangesRemaining?, rankingPolicyFollowed? (vault, after auditPage) } | DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_CENTER_REQUIRED, DISCOVERY_FILTER_INVALID, VALIDATION_FAILED, PRECONDITION_FAILED, IDEMPOTENCY_KEY_REUSED, RATE_LIMITED, EXPIRED, UNAUTHENTICATED |

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_CENTER_TOO_PRECISE | 422 | no | center cell is finer than allowed for this caller class |
| DISCOVERY_CENTER_REQUIRED | 422 | no | no center was supplied and none can be derived from a home cell at public level L1 or L2 |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Query-only module with no events. Abuse patterns are reported to the relay-local moderation signal port (F12.S03.M02 SignalPort.record, kind proximity_pattern, whose signals F12.S03.M01 may turn into friction) and are not catalog events. Geo codes are owned by F06.S02.M01 and filter codes by F06.S01.M03 (N1). DISCOVERY_CENTER_TOO_PRECISE (center finer than this caller class allows) differs from DISCOVERY_PRECISION_FORBIDDEN (any cell finer than L2 in a public payload) because a 5-character center is valid for members but not for anonymous callers. Execution sites - in the vault the query runs on the local index; for a relay the vault builds the center (V03, V09), sends the request, verifies each item's envelope (F11.S01.M03), runs F06.S03.M02 auditPage on the page and applies filterBlocked and the local hide port before display.

### Example

```
vault, publicLevel L1, no center given -> relay request: POST /api/v1/query/discovery.proximity.search { "centerCell": "u4pr", "radiusKm": 25, "limit": 20 }
200 { "items": [{ "documentId": "0192f3b0-…", "sourceKind": "listing", "sourceId": "0192f3a4-…", "sourceRevision": 3, "projectionCid": "sha256-Qm…", "authorDid": "did:key:z6Mk…", "title": "Trek road bike 56cm", "distanceBucket": "10_25", "geoCell": "u4prv", "promoted": true, "explain": [{ "key": "discovery.explain.promoted" }], "provenance": ["relay:relay.example.org"], "envelope": { … } }], "areaChangesRemaining": 4 }
429 { "code": "RATE_LIMITED", "retryable": true, "params": { "reason": "center_changes" }, "retryAfterMs": 1800000 }
RateLimitPort.consume({ capabilityClass: "read.proximity.center_new", actorKeyHash: "t_41a…", ipPrefixHash: "p_90de…" }, cost=1)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T07 | contract | PS-049-04.R01, PS-049-04.R02, PS-049-09.R02 | query executes | output validates against registry schema, contains only P0 fields and the identity fields authorDid, sourceKind, sourceId, sourceRevision, projectionCid, promoted, provenance |
| TEST-PS-049-09.T16 | integration | PS-049-04.R03 | trigger the pattern detector | F12.S03.M02 SignalPort.record called once with kind proximity_pattern; no catalog event emitted; metric pattern incremented |
| TEST-PS-049-09.T17 | integration | PS-049-04.R02, PS-049-04.R04 | relay page with 6 promoted items of 20, an item of a blocked author, and an item with a forged title | page reranked to at most 4 promoted, each with promoted true and the discovery.explain.promoted key; the blocked author's item and the forged item never reach the display |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
