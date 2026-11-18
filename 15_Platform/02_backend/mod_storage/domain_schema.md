# PS-119-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (R01, R06), CTR-PRV-001 (R01, R03, R06), CTR-SCH-001 (R01), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-01.R01 | `stored_blob` is the only record class owned here. Attachment (`att_`, F08) and listing media owners reference blobs by `blob_id`; storage never owns their business meaning. | MVP |
| PS-119-01.R02 | Every blob is content-addressed by SHA-256 of its stored bytes; duplicate uploads by the same owner share one object only within that owner's scope. | MVP |
| PS-119-01.R03 | Original bytes are retained only if `metadata_stripped = true` for images (PS-119-02). | MVP |
| PS-119-01.R04 | `blob_id` format PENDING CTR-ID-001 prefix `blb_` (ulid, 26 chars). | MVP |

## Data / schema
```sql
CREATE TABLE stored_blob (
  blob_id          CHAR(30)     PRIMARY KEY,        -- blb_ PENDING registration
  owner_ref        CHAR(30)     NOT NULL,           -- acc_ / lst_ / att_ / sys_ (referencing owner)
  owner_scope      VARCHAR(16)  NOT NULL CHECK (owner_scope IN ('listing','attachment','profile','system')),
  mime_type        VARCHAR(64)  NOT NULL,           -- from allow-list (PS-119-02)
  byte_size        INTEGER      NOT NULL CHECK (byte_size > 0),
  sha256           CHAR(64)     NOT NULL,
  data_class       VARCHAR(24)  NOT NULL,           -- CTR-PRV-001 class
  metadata_stripped BOOLEAN     NOT NULL DEFAULT false,
  state            VARCHAR(16)  NOT NULL CHECK (state IN ('PENDING_SCAN','AVAILABLE','QUARANTINED','DELETED')),
  storage_key      VARCHAR(128) NOT NULL,           -- opaque object key, never derived from content or owner ID
  created_at       TIMESTAMPTZ  NOT NULL,
  deleted_at       TIMESTAMPTZ  NULL
);
CREATE INDEX stored_blob_owner ON stored_blob (owner_ref, state);
```
`storage_key` is random (CSPRNG, 128-bit). Encryption at rest with KMS-held key (ASSUMPTION; D10 key ownership deferred).

## Commands / queries / events
- Commands: `blob.put` (see PS-119-04), `blob.delete` (owner or cascade).
- Events: `blob.quarantined`, `blob.deleted` (aggregate `blob`, CTR-EVT-001 R10). Event payload carries `blob_id` and reason code only.

## States & transitions
Defined in PS-119-03.

## Validation & errors
Field rules in PS-119-02. `data_class` is set by the referencing owner and checked against the owner's class; storage rejects a `data_class` lower than the owner's declared class.

## Authorization
Writes by storage `sys_` principal. Reads of bytes by authorization check of the referencing owner (PS-119-05).

## Failure, idempotency, concurrency, offline
`blob_id` is generated server-side; the upload idempotency key is `(owner_ref, client_upload_id)`. Object write precedes row commit; orphan objects reclaimed by a sweeper (PS-119-06).

## Privacy, retention, abuse
Retention by owner scope: attachments follow F08 retention; listing images follow listing lifecycle; `DELETED` rows keep `sha256` and timestamps 30 days, then row removed (ASSUMPTION). Deletion propagates to CDN and caches within 24 h (CTR-PRV-001 R06).

## Observability & budgets
Gauge `stored_blob_bytes{owner_scope,state}`. Row insert p95 ≤ 10 ms.

## Tests
- TEST-PS-119-01-01 (integration): duplicate upload within owner scope produces one object.
- TEST-PS-119-01-02 (unit): `storage_key` entropy and no derivation from owner ID.
- TEST-PS-119-01-03 (schema scan): no column stores filename or EXIF content.

## Acceptance criteria
1. Schema matches SQL above after `blb_` registration.
2. `data_class` downgrade attempts rejected in 100% of tests.
3. Deletion reaches object store and CDN within 24 h (test clock).

## Assumptions & open decisions
- PENDING CTR-ID-001 registration of `blb_`.
- ASSUMPTION: 30-day tombstone row retention.
- D07 PROVISIONAL (default: minimal per-category retention with legal-hold exceptions; unapproved).
