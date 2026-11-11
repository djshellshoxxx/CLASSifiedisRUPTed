# PS-046-04 — Commands, queries and events: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-04.R01** Saved search create, update and delete are vault-local commands that produce no signed statement and never contact a relay.
- **PS-046-04.R02** discovery.search.query is a query served by the vault against the local index and, separately, a relay query endpoint; neither writes state except the relay's ephemeral rate counters.
- **PS-046-04.R03** Matching consumes discovery.index.updated, uses its payload only to pre-select candidate searches, confirms each candidate against the local index with the canonical compiled filter and the sanitized FTS MATCH restricted to that document, and emits discovery.saved_search.matched as a local P3 event in the same transaction as the bookkeeping update.
- **PS-046-04.R04** For source both, local and relay results are separate ranked sections with separate cursors (nextCursor { local?, relay? }); relay items are rendered only from verified signed projections and de-duplicated by (authorDid, sourceId) with the verified higher sourceRevision winning.
- **PS-046-04.R05** The vault pull fetches relay projections for saved-search areas through F06.S01.M01 list_by_cell by L1 cells only, at a fixed interval, and hands the envelopes to F11.S01.M02 for verification before anything is indexed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.saved_search.create` | discovery.saved_search.write_own | { name, queryText?, filters?, centerCell?, radiusKm?, alertMode } | { savedSearchId, revision: 1, watermarkAt } | VALIDATION_FAILED, DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_PRECISION_FORBIDDEN, DISCOVERY_SAVED_SEARCH_LIMIT, UNAUTHENTICATED |  | yes (Idempotency-Key) |
| `discovery.saved_search.update` | discovery.saved_search.write_own | { savedSearchId, expectedRevision, name?, queryText?, filters?, centerCell?, radiusKm?, alertMode?, status?: active\|paused } | { savedSearchId, revision, watermarkAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_PRECISION_FORBIDDEN, UNAUTHENTICATED |  | yes (Idempotency-Key) |
| `discovery.saved_search.delete` | discovery.saved_search.write_own | { savedSearchId, expectedRevision } | { savedSearchId, deleted: true } | NOT_FOUND, CONFLICT_REVISION, UNAUTHENTICATED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.search.query` | discovery.search_document.read_public | { q?, filters?, near?: { centerCell (4 or 5 characters), radiusKm }, sort?: relevance\|newest\|price_asc\|price_desc\|distance, source?: local\|relay\|both, cursor?: { local?, relay? }, limit? (1..50, default 20) } | { sections: [{ source: local\|relay, relayId?, status: ok\|error, code?, droppedUnverified?, rankingPolicyFollowed?, items: [{ documentId, sourceKind, sourceId, sourceRevision, projectionCid, authorDid, title, snippet, priceMinor?, currency?, geoCell?, distanceBucket?, promoted?, promotedBy?, explain, provenance, verified: true }] }], nextCursor?: { local?, relay? } } | DISCOVERY_QUERY_INVALID, DISCOVERY_FILTER_INVALID, DISCOVERY_FILTER_CENTER_REQUIRED, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED, VALIDATION_FAILED, EXPIRED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE, UNAUTHENTICATED |
| `discovery.saved_search.list` | discovery.saved_search.read_own | { status?: active\|paused, cursor?, limit? (1..25) } | { items: SavedSearch[], nextCursor? } | UNAUTHENTICATED |
| `discovery.saved_search.get_pull_scope` | discovery.saved_search.read_own | {} (no parameters) | { relays: string[], cells4: string[] (at most 32), intervalMinutes: 30, lastPullAt? } | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.saved_search.matched` | P3 | { savedSearchId, mode: instant\|daily, documentIds: array of at most 20, matchedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `discovery.index.updated` | op upsert only (op rebuilt and remove are ignored): skip unless firstSeenAt is later than the candidate search's watermarkAt; pre-select at most 200 active candidate searches from the payload (listingKind, categoryId, geoCell, priceMinor, currency, condition, barterAcceptable, inStock, wantMinCondition); confirm each candidate by running its canonical compiled filter (F06.S01.M03) and sanitized FTS MATCH against the local index restricted to rowid = documentId; drop the document if its author is blocked (F07.S02.M02 filterBlocked) or it is hidden locally (F12.S01.M01 local hide read port); record the match keyed by (savedSearchId, documentId) and advance lastEvaluatedAt after the batch |
| `identity.block.added` | drop pending, not yet emitted digest entries for documents of the blocked author; display-time filtering always calls filterBlocked, so no block cache is kept |
| `privacy.deletion.completed` | no evidence is held to pseudonymize; saved searches and match rows were already removed by the registered DeletionPort plan during execution; clear the pull scope |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_QUERY_INVALID | 422 | no | query text exceeds limits or contains no usable term after sanitization |
| DISCOVERY_SAVED_SEARCH_LIMIT | 409 | no | 25 saved searches already exist |
| DISCOVERY_RELAY_ITEM_UNVERIFIED | 502 | no | a relay item's signed projection was missing or failed verification and the item was dropped (reported per section, never shown) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): saved-search commands, matching and the pull scheduler run only in the vault; the relay serves discovery.search.query over its own index. A relay response item is a claim: the relay returns the signed projection envelope with each item (or the vault fetches it by projectionCid), and the vault renders title, snippet, price and cell from the verified projection only (V11). Section rules - the local section is scored with the bundled RankingConfig and reranked with F06.S03.M02 (promotionEnabled false); each relay section keeps the relay's order and promoted flags, which are labelled 'Promoted on <relay>', and is checked with F06.S03.M02 auditPage, failing pages being labelled 'ranking policy not followed'. A listing present in both sections is shown once in the local section with both provenance labels; if the relay's verified projection has the higher sourceRevision it is passed to F11.S01.M02 federation.record.receive so the local index catches up. Each section has its own cursor; a relay cursor is opaque to the vault and HMAC-signed by the relay.

### Example

```
vault query: discovery.search.query { "q": "road bike \"56 cm\"", "filters": { "price": { "currency": "EUR", "max": 30000 } }, "near": { "centerCell": "u4pru", "radiusKm": 10 }, "source": "both" }
-> { sections: [ { source: "local", status: "ok", items: [{ title: "Trek road bike 56cm", distanceBucket: "5_10", provenance: ["device", "relay:relay.example.org"], verified: true }] },
                 { source: "relay", relayId: "relay.example.org", status: "ok", droppedUnverified: 1, rankingPolicyFollowed: true, items: [ … ] } ],
     nextCursor: { local: "l1…", relay: "r1…" } }
relay query from an anonymous caller: { "near": { "centerCell": "u4pru", "radiusKm": 10 } } -> 422 DISCOVERY_CENTER_TOO_PRECISE
vault command: discovery.saved_search.create { "name": "Road bikes", "queryText": "road bike", "alertMode": "instant" } -> { "savedSearchId": "0192f3d0-…", "revision": 1, "watermarkAt": "2026-11-04T10:00:00.000Z" }
vault pull: list_by_cell { "cells4": ["u4pr", "u4px"] } on relay.example.org -> envelopes to federation.record.receive
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T06 | contract | PS-046-04.R01, PS-046-04.R02, PS-046-09.R02 | each command, the query with source local, relay and both, and the matched event run | outputs validate against registry schemas, including sections and nextCursor { local, relay } |
| TEST-PS-046-09.T07 | integration | PS-046-04.R03, PS-046-06.R03 | index event for a document matching two saved searches delivered twice, then the document edited, then op rebuilt, and a document first seen before the watermark | one matched event per search; no alert after edit or rebuild; none for the pre-watermark document even after its id was trimmed from matchedDocIds |
| TEST-PS-046-09.T12 | integration | PS-046-04.R04, PS-046-06.R02 | local and relay return the same listing, the relay copy with a higher verified sourceRevision | one card in the local section with both provenance labels and the newer verified content; the relay projection passed to federation.record.receive |
| TEST-PS-046-09.T19 | abuse | PS-046-04.R04, PS-046-07.R01 | relay returns an item with a forged title and price for a real authorDid, and an item without a projection | neither item is displayed; relay section droppedUnverified 2; DISCOVERY_RELAY_ITEM_UNVERIFIED recorded locally |
| TEST-PS-046-09.T21 | contract | PS-046-04.R04 | source both with a relay page holding 5 items of one author and 6 promoted of 20 | two sections with separate cursors; local section reranked with promotionEnabled false; relay section labelled ranking policy not followed and promoted items labelled 'Promoted on <relay>' |
| TEST-PS-046-09.T22 | abuse | PS-046-04.R05, PS-046-07.R01 | capture the pull requests for 3 active saved searches with text and price filters | each request has only cells4 (L1) and a cursor, every 30 minutes, no query text, filters or saved-search ids; Settings > Search data lists the same cells |
| TEST-PS-046-09.T24 | integration | PS-046-04.R03 | saved search 'road bike' under 300 EUR; index event for a document in the right category and area but titled 'sofa' or priced 500 EUR | no alert because the compiled filter and FTS MATCH confirmation reject it |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
