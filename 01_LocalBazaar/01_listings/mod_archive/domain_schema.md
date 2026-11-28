# PS-001-01 — Domain schema: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-01.R01** An ArchiveRecord stores the end-of-life of one listing: kind of end, reason, optional reference, restoreUntil and purgeAt.
- **PS-001-01.R02** References to deals or trades are owner assertions labelled unverified unless the referenced module provides a signed completion.
- **PS-001-01.R03** ArchiveRecords are P1 vault data; a record whose listing is cited by an Offer, Negotiation or Deal is kept for RET-EVIDENCE after the listing purge and pseudonymized on privacy.deletion.completed, and every other record is purged with the listing.

## Specification

### ArchiveRecord

Schema `classrup.bazaar.archive_record/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| ownerId | did:key — local principal; replaced by the deletion pseudonym in records kept as evidence |
| status | enum — deferred \| expired \| closed \| archived \| restored \| superseded \| purged |
| closeReason? | enum — sold \| given \| traded \| fulfilled \| sold_out \| other; set when status is closed |
| closedWithRef? | object — {type: deal\|proposal\|cycle\|giveaway_request, id: uuidv7, verified: boolean}; P1, never in events |
| deferredSince? | timestamp — expiry deferred because Deal-linked or cycle holds were active and the renewal cap was reached |
| autoExtensions | int — 0..3 renewals requested by the expiry sweep |
| endedAt | timestamp — RFC 3339 UTC of the first end event |
| archivedAt? | timestamp — RFC 3339 UTC |
| restoreUntil? | timestamp — archivedAt + 90 d |
| deletionRequestedAt? | timestamp — set from privacy.deletion.requested |
| purgeAt? | timestamp — min(restoreUntil, deletionRequestedAt + 30 d) for unreferenced content |
| evidenceUntil? | timestamp — last related activity + 2 years when an Offer, Negotiation or Deal cites the listing |
| restoredAt? | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one ArchiveRecord per listing is not in status restored, superseded or purged.
- status archived implies restoreUntil = archivedAt + 90 days exactly; purgeAt = min(restoreUntil, deletionRequestedAt + 30 d) for unreferenced content.
- status closed implies closeReason is set and the listing has no active publication.
- status purged with evidenceUntil set keeps only id, listingId, status, closeReason, closedWithRef, endedAt and evidenceUntil; all listing content is gone.
- Field classes are annotated per F10.S02.M02 (all P1).

### Storage DDL

```sql
CREATE TABLE bazaar_archive_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  status TEXT NOT NULL, purge_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_archive_open ON bazaar_archive_record(tenant_id, listing_id)
  WHERE status IN ('deferred','expired','closed','archived');
CREATE INDEX bazaar_archive_purge ON bazaar_archive_record(tenant_id, status, purge_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T01 | unit | PS-001-01.R01, PS-001-01.R02, PS-001-02.R01 | close A with reason sold and a deal ref | ArchiveRecord closed, closedWithRef.verified false, Listing closed |
| TEST-PS-001-09.T19 | integration | PS-001-01.R03, PS-001-07.R02 | purge C with an accepted offer citing it and D without references, then privacy.deletion.requested and completed | C keeps evidence fields until evidenceUntil with ownerId pseudonymized and keepEvidence passed to F01.S01.M01; D purged at min(restoreUntil, request + 30 d) with a tombstone |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
