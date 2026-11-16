# PS-045-04 — Commands, queries and events: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-04.R01** The only command is rebuild; it is a vault-local command on a device and a relay command when served by a relay operator, and it never produces a signed statement.
- **PS-045-04.R02** Normal indexing is driven by consumed events (local events in a vault, events derived from verified statements with actor.kind federated or user); no network or statement is produced by this module.
- **PS-045-04.R03** Each applied change emits exactly one discovery.index.updated event in the same local transaction as the document change.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.index.rebuild` | discovery.search_document.rebuild | { scope: all\|listing\|offering\|auction\|rental } | { rebuildId, startedAt, status: started } | DISCOVERY_REBUILD_IN_PROGRESS, FORBIDDEN | discovery.index.updated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.index.stats` | discovery.search_document.read_stats | { scope?: all\|listing\|offering\|auction\|rental } | { activeCount, removedCount, oldestPendingEventAgeMs, lastRebuildAt?, byKind: {listing, offering, auction, rental}, byOrigin: {own, fetched, imported, relay_published} } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.index.updated` | P0 | { documentId, sourceKind, sourceId, op: upsert\|remove\|rebuilt, listingKind?, categoryId?, geoCell5?, authorDid?, origin?, claimedPublishedAt?, priceMinor?, currency? } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.published` | verify signed projection and upsert a document (kinds sell, wanted, giveaway, service, rental, auction); in a vault the event is local for own listings or derived from a verified received statement |
| `bazaar.listing.edited` | reload projection and update the document if the source revision is newer |
| `bazaar.listing.unpublished` | remove the document with reason unpublished |
| `bazaar.listing.expired` | remove the document with reason expired |
| `bazaar.listing.archived` | remove the document with reason archived |
| `bazaar.listing.restored` | reload projection and re-add the document only if the listing is published again |
| `bazaar.sell_terms.set` | update priceMinor, currency and barterAcceptable from the verified projection |
| `bazaar.variant.changed` | update the lowest variant price in priceMinor |
| `bazaar.inventory.depleted` | remove the document with reason sold_out |
| `services.offering.published` | upsert a document with sourceKind offering and listingKind service |
| `services.offering.withdrawn` | remove the document with reason withdrawn |
| `auctions.auction.opened` | set endsAt from the host-signed auction statement and mark the auction document active |
| `auctions.auction.extended` | update endsAt to the host-signed new end time |
| `auctions.auction.closed` | remove the document with reason auction_closed |
| `federation.tombstone.applied` | remove the document the signed tombstone targets with reason tombstoned and refuse later republish of that cid |
| `moderation.action.applied` | relay: remove documents covered by that relay's hosting-policy action with reason hosting_policy; vault: apply a local hide with reason local_hidden |
| `privacy.deletion.completed` | vault erase: remove all documents with origin own and, on full erase, all documents |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_CELL_TOO_PRECISE | 422 | no | location cell is longer than 5 geohash characters (finer than L2) |
| DISCOVERY_PROJECTION_INVALID | 422 | no | projection signature, schema, expiry or tombstone check failed |
| DISCOVERY_SOURCE_STALE | 409 | no | event revision is not newer than the indexed revision |
| DISCOVERY_REBUILD_IN_PROGRESS | 409 | no | a rebuild is already running |
| DISCOVERY_INDEX_CAP | 409 | no | document cap reached; eviction or deferral applied |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
event bazaar.listing.published (actor.kind federated, via relay https://relay.example.org)
  { aggregate.id: "0192f3a4-5b6c-7d8e-9f01-23456789abcd", revision: 3, payload: { cid: "sha256-Qm…", author: "did:key:z6Mk…" } }
-> signature verifies, geoCell "u4pru", price 45000 EUR
-> emits discovery.index.updated { documentId: "0192f3b0-…", sourceKind: "listing", op: "upsert", geoCell5: "u4pru", origin: "fetched" }
vault command: discovery.index.rebuild { "scope": "all" }  -> { "rebuildId": "0192f3c1-…", "startedAt": "2026-11-04T10:00:00.000Z", "status": "started" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T06 | integration | PS-045-04.R02, PS-045-06.R01 | deliver the same event twice and an older edit afterwards | one document, stale edit ignored |
| TEST-PS-045-09.T07 | contract | PS-045-04.R01, PS-045-04.R03 | rebuild command and each applied change | command and discovery.index.updated payloads validate against registry schemas; one event per change |
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02 | signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
