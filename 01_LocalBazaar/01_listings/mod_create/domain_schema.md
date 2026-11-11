# PS-002-01 — Domain schema: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-01.R01** A Listing stores owner principal, kind, title, description, category, condition, media references, tags, locale, coarse region cell, status and revision; it has no field that can hold an exact address or coordinates.
- **PS-002-01.R02** Drafts are P3 and live only in the owner's vault (IndexedDB) under the record schema classrup.bazaar.listing_record/v1; the public projection is a different signed statement (classrup.bazaar.listing/v1) produced by F01.S01.M03, and the Listing record itself is never uploaded.
- **PS-002-01.R03** Kind and ownerId are immutable after creation; every other mutation goes through apply_edit or apply_status with expectedRevision.

## Specification

### Listing

Schema `classrup.bazaar.listing_record/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, writer-generated (client) |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| ownerId | did:key — local principal; immutable |
| kind | enum — sell \| wanted \| giveaway \| service \| rental \| auction; immutable |
| subtypeRef? | object — {slug: services\|rentals\|auctions, entity: string, id: uuidv7}; required for service, rental, auction |
| title | string — 3..120 code points, NFC, no control characters |
| description | string — 0..5000 code points (publication requires >= 10) |
| categoryId | uuidv7 — ref F18.S01.M03 Category; active leaf |
| condition? | enum — new \| like_new \| good \| fair \| poor \| for_parts; required for sell, giveaway, rental |
| mediaRefs | string[] — <= 10 items, each blob:sha256-<base64url>, image/jpeg\|png\|webp, <= 5 MiB, EXIF/GPS stripped |
| tags? | string[] — <= 10 items, each 2..30 code points lowercase |
| locale | string — BCP 47, default vault locale |
| regionCell? | string — geohash length 4 (L1) or 5 (L2), lowercase base32; never longer |
| status | enum — draft \| published \| unpublished \| expired \| closed \| archived \| deleted |
| closeReason? | enum — sold \| given \| traded \| fulfilled \| sold_out \| other; set only with status closed |
| currentPublicationId? | uuidv7 — ref F01.S01.M03 PublicationRecord |
| publishedAt? | timestamp — RFC 3339 UTC |
| expiresAt? | timestamp — set while published |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- No persisted field holds latitude, longitude, street address or a geohash longer than 5 characters.
- status published implies currentPublicationId and expiresAt are set; status draft implies publishedAt is unset.
- kind and ownerId never change; at most 50 listings with status draft per vault.
- Every field carries an F10.S02.M02 classification (P3 for the record; title, description, categoryId, condition, mediaRefs, tags, locale and regionCell become P0 only inside the signed projection).

### Storage DDL

```sql
CREATE TABLE bazaar_listing (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, owner_id TEXT NOT NULL, kind TEXT NOT NULL,
  category_id TEXT NOT NULL, status TEXT NOT NULL, region_cell TEXT, expires_at TEXT,
  revision INTEGER NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX bazaar_listing_owner ON bazaar_listing(tenant_id, owner_id, status, updated_at);
CREATE INDEX bazaar_listing_expiry ON bazaar_listing(tenant_id, status, expires_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T01 | unit | PS-002-01.R01, PS-002-02.R01 | create a valid sell draft | Listing stored with status draft, revision 1; unknown field rejected |
| TEST-PS-002-09.T16 | unit | PS-002-01.R03 | apply_edit with a patch containing kind or ownerId, and apply_status attempting to change kind | VALIDATION_FAILED; stored kind and ownerId unchanged; revision not incremented |
| TEST-PS-002-09.T17 | integration | PS-002-01.R02 | create, edit and delete drafts with a network spy, then inspect the sync outbox | zero network requests; no outbox entry has a destination or payload derived from a draft; stored record validates as classrup.bazaar.listing_record/v1, never as the projection schema |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
