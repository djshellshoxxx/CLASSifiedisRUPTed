# PS-001-01 — Domain schema: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-01.R01** An ArchiveRecord stores the end-of-life of one listing: kind of end, reason, optional reference, restoreUntil and purgeAt.
- **PS-001-01.R02** References to deals or trades are owner assertions labelled unverified unless the referenced module provides a signed completion.
- **PS-001-01.R03** ArchiveRecords are P1 vault data retained as evidence and purged with the listing.

## Specification

### ArchiveRecord

Schema `classrup.bazaar.archive_record/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| ownerId | did:key — local principal |
| status | enum — expired \| closed \| archived \| restored \| purged |
| closeReason? | enum — sold \| given \| traded \| fulfilled \| sold_out \| other; set when status is closed |
| closedWithRef? | object — {type: deal\|proposal\|cycle\|giveaway_request, id: uuidv7, verified: boolean} |
| endedAt | timestamp — RFC 3339 UTC of the first end event |
| archivedAt? | timestamp — RFC 3339 UTC |
| restoreUntil? | timestamp — archivedAt + 90 d |
| purgeAt? | timestamp — restoreUntil |
| restoredAt? | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one ArchiveRecord per listing is not in status restored or purged.
- status archived implies restoreUntil = archivedAt + 90 days exactly.
- status closed implies closeReason is set and the listing has no active publication.

### Storage DDL

```sql
CREATE TABLE bazaar_archive_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  status TEXT NOT NULL, purge_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_archive_open ON bazaar_archive_record(tenant_id, listing_id)
  WHERE status IN ('expired','closed','archived');
CREATE INDEX bazaar_archive_purge ON bazaar_archive_record(tenant_id, status, purge_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T01 | unit | PS-001-01.R01, PS-001-01.R02, PS-001-02.R01, PS-001-02.R02 | close A with reason sold and a deal ref | ArchiveRecord closed, closedWithRef.verified false, Listing closed |
| TEST-PS-001-09.T02 | unit | PS-001-01.R03, PS-001-07.R02 | read stored records and events | no content beyond P1 fields; event carries reason enum only |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
