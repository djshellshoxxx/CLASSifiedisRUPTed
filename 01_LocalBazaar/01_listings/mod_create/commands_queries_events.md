# PS-002-04 — Commands, queries and events: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-04.R01** Commands are vault commands run by the unlocked local principal; none contacts a relay, and none produces a signed statement (publication is F01.S01.M03).
- **PS-002-04.R02** Every command writes its state change and its outbox event in one IndexedDB transaction (EVT-8).
- **PS-002-04.R03** Query results contain only the owner's own listings; other principals' listings arrive as verified mirrors owned by F11.S01.M02.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.listing.create` | bazaar.listing.create | [vault-local] { id? (uuidv7), kind, title, description?, categoryId, condition?, mediaRefs?, tags?, locale?, regionCell?, subtypeRef? } | { listingId, revision: 1, status: draft } | VALIDATION_FAILED, BAZAAR_LISTING_LOCATION_TOO_PRECISE, BAZAAR_LISTING_CATEGORY_INVALID, BAZAAR_LISTING_MEDIA_INVALID, BAZAAR_LISTING_DRAFT_LIMIT, FEATURE_DISABLED | bazaar.listing.created | yes (Idempotency-Key) |
| `bazaar.listing.delete` | bazaar.listing.delete | [vault-local] { listingId, expectedRevision } | { listingId, deletedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.listing.deleted | yes (Idempotency-Key) |
| `bazaar.listing.apply_status` | bazaar.listing.apply_status | [vault-local, internal port] { listingId, expectedRevision, to, expiresAt?, publicationId?, closeReason?, reason } | { listingId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `bazaar.listing.apply_edit` | bazaar.listing.apply_edit | [vault-local, internal port] { listingId, expectedRevision, patch: { title?, description?, categoryId?, condition?, mediaRefs?, tags?, regionCell? } } | { listingId, revision, changedFields } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_LISTING_LOCATION_TOO_PRECISE, BAZAAR_LISTING_CATEGORY_INVALID, BAZAAR_LISTING_MEDIA_INVALID |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.listing.get` | bazaar.listing.read | { listingId } | { listing: Listing } | NOT_FOUND |
| `bazaar.listing.list_mine` | bazaar.listing.read_own | { status?, kind?, cursor?, limit <= 50 } | { items: Listing[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.created` | P3 | { listingId, ownerId, kind, categoryId, status: draft } |
| `bazaar.listing.deleted` | P1 | { listingId, ownerId, reason: owner\|draft_purge\|archive_purge } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_LISTING_LOCATION_TOO_PRECISE | 422 | no | payload contains coordinates, address fields or a region cell finer than L2 |
| BAZAAR_LISTING_CATEGORY_INVALID | 422 | no | category missing, retired or not a leaf |
| BAZAAR_LISTING_MEDIA_INVALID | 422 | no | media reference missing, wrong type, over 5 MiB or carrying GPS metadata |
| BAZAAR_LISTING_DRAFT_LIMIT | 409 | no | vault already holds 50 drafts |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault.dispatch("bazaar.listing.create", { "kind": "sell", "title": "Road bike, 54 cm", "categoryId": "0192f3a4-1111-7000-8000-0000000000c1",
  "condition": "good", "regionCell": "u33db", "mediaRefs": ["blob:sha256-Qm9..."] }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000011")
=> { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "revision": 1, "status": "draft" }
vault.dispatch("bazaar.listing.create", { "kind": "sell", "title": "x", "lat": 52.5, "lon": 13.4 })
=> 422 BAZAAR_LISTING_LOCATION_TOO_PRECISE
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T05 | contract | PS-002-04.R01, PS-002-04.R02, PS-002-09.R02 | each command runs | outputs and bazaar.listing.created/deleted payloads validate against registry schemas |
| TEST-PS-002-09.T06 | integration | PS-002-04.R03, PS-002-05.R01 | query another principal's listing id | NOT_FOUND; list_mine returns only own listings |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
