# PS-046-04 — Commands, queries and events: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-04.R01** Saved search create, update and delete are vault-local commands that produce no signed statement and never contact a relay.
- **PS-046-04.R02** discovery.search.query is a query served by the vault against the local index and, separately, a relay query endpoint; neither writes state.
- **PS-046-04.R03** Matching consumes discovery.index.updated and emits discovery.saved_search.matched as a local P3 event in the same transaction as the matchedDocIds update.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.saved_search.create` | discovery.saved_search.write_own | { name, queryText?, filters?, centerCell5?, radiusKm?, alertMode } | { savedSearchId, revision: 1 } | VALIDATION_FAILED, DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_SAVED_SEARCH_LIMIT |  | yes (Idempotency-Key) |
| `discovery.saved_search.update` | discovery.saved_search.write_own | { savedSearchId, expectedRevision, name?, queryText?, filters?, centerCell5?, radiusKm?, alertMode?, status?: active\|paused } | { savedSearchId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_RADIUS_TOO_SMALL |  | yes (Idempotency-Key) |
| `discovery.saved_search.delete` | discovery.saved_search.write_own | { savedSearchId, expectedRevision } | { savedSearchId, deleted: true } | NOT_FOUND, CONFLICT_REVISION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.search.query` | discovery.search_document.read_public | { q?, filters?, near?: { centerCell5, radiusKm }, sort?: relevance\|newest\|price_asc\|price_desc\|distance, source?: local\|relay\|both, cursor?, limit? (1..50, default 20) } | { items: [{ documentId, sourceKind, sourceId, authorDid, title, snippet, priceMinor?, currency?, geoCell5?, distanceBucket?, promoted?, explain, provenance }], nextCursor?, sources: [{ source, status }] } | DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_RADIUS_TOO_SMALL, EXPIRED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE |
| `discovery.saved_search.list` | discovery.saved_search.read_own | { status?: active\|paused, cursor?, limit? (1..25) } | { items: SavedSearch[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.saved_search.matched` | P3 | { savedSearchId, mode: instant\|daily, documentIds: array of at most 20, matchedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `discovery.index.updated` | for op upsert, evaluate candidate saved searches by category, kind and area (at most 200 candidates per document) and record a match |
| `identity.block.added` | drop pending matches from the blocked author and refresh the block filter cache |
| `privacy.deletion.completed` | delete all saved searches on vault erase |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_QUERY_INVALID | 422 | no | query text exceeds limits or contains no usable term after sanitization |
| DISCOVERY_FILTER_INVALID | 422 | no | a filter value is out of range or of the wrong type |
| DISCOVERY_RADIUS_TOO_SMALL | 422 | no | radius below 5 km or not an allowed value |
| DISCOVERY_SAVED_SEARCH_LIMIT | 409 | no | 25 saved searches already exist |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault query: discovery.search.query { "q": "road bike \"56 cm\"", "filters": { "priceMax": { "amount": "30000", "currency": "EUR" } }, "near": { "centerCell5": "u4pru", "radiusKm": 10 }, "source": "both" }
-> { items: [{ title: "Trek road bike 56cm", distanceBucket: "5_10", provenance: ["relay:relay.example.org"] }], sources: [{ source: "local", status: "ok" }, { source: "relay", status: "ok" }] }
vault command: discovery.saved_search.create { "name": "Road bikes", "queryText": "road bike", "alertMode": "instant" } -> { "savedSearchId": "0192f3d0-…", "revision": 1 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T06 | contract | PS-046-04.R01, PS-046-04.R02, PS-046-09.R02 | each command, the query and the matched event run | outputs validate against registry schemas |
| TEST-PS-046-09.T07 | integration | PS-046-04.R03, PS-046-06.R03 | index event for a document matching two saved searches, delivered twice, and then edited | one matched event per search, no duplicate after edit |
| TEST-PS-046-09.T12 | integration | PS-046-01.R03, PS-046-04.R02, PS-046-06.R02 | local and relay return the same listing | merged into one card with both provenance labels |
| TEST-PS-046-09.T14 | a11y | PS-046-04.R02 | search screen and saved search list with axe-core | zero serious or critical violations and results count announced |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
