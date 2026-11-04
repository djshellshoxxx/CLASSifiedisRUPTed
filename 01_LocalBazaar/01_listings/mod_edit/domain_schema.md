# PS-003-01 — Domain schema: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-01.R01** A ListingRevision is an immutable snapshot of the public fields of a listing at one revision number, with changedFields, a material flag and the editor principal.
- **PS-003-01.R02** Revisions are written only for listings that have been published at least once; plain draft edits only bump Listing.revision to bound storage.
- **PS-003-01.R03** Revision snapshots are P1 data in the owner's vault and are retained as commerce evidence because offers cite the revision the buyer saw.

## Specification

### ListingRevision

Schema `classrup.bazaar.listing_revision/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| revisionNo | int — equals Listing.revision after the change; unique per listing |
| editorId | did:key — local principal |
| source | enum — owner_edit \| sell_terms \| variant \| wanted_spec \| system |
| changedFields | string[] — <= 20 names such as title, price, condition, categoryId |
| material | boolean — true when price, condition or category changed |
| snapshot | object — public fields as published (title, description, categoryId, condition, mediaRefs, tags, regionCell, price?), <= 32 KiB |
| snapshotHash | string — sha256- over JCS(snapshot) |
| wasPublic | boolean — listing status was published or unpublished-after-publish at the time |
| createdAt | timestamp — RFC 3339 UTC |

**Invariants**
- A ListingRevision is never updated or deleted while its listing exists; it is purged only with the listing.
- revisionNo values for one listing are strictly increasing without reuse; at most 100 rows per listing.
- material is true exactly when changedFields intersects {price, variant_price, condition, categoryId}.

### Storage DDL

```sql
CREATE TABLE bazaar_listing_revision (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, revision_no INTEGER NOT NULL,
  material INTEGER NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_listing_revision_no ON bazaar_listing_revision(tenant_id, listing_id, revision_no);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T01 | unit | PS-003-01.R01, PS-003-01.R02 | edit title of published L then edit draft D | revision row exists for L with snapshotHash; none for D, whose Listing.revision still increments |
| TEST-PS-003-09.T02 | property | PS-003-01.R03, PS-003-02.R01 | random patches | material equals intersection of changedFields with price, condition, categoryId; ownerId and kind patches rejected |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
