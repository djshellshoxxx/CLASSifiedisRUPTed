# PS-001-04 — Commands, queries and events: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-04.R01** close, archive, restore and expire are vault commands; none produces a signed statement itself; the tombstone is produced by bazaar.publication.end in F01.S01.M03 when a publication is active, and a reservation release by F01.S03.M01 when a Deal-linked hold is released with its Deal.
- **PS-001-04.R02** Events expired, archived, restored and closed are emitted in the same transaction as the status change.
- **PS-001-04.R03** Expiry also depends on the owner's own clock; other vaults apply the expiresAt inside the signed projection and treat relay receipt times as claims.
- **PS-001-04.R04** The expire command ends the active publication through bazaar.publication.end {reason expired} of F01.S01.M03 in its own transaction, which issues the tombstone through F11.S01.M02 federation.tombstone.issue (idempotent per target), and bazaar.listing.expired carries that tombstoneCid, so F11.S01.M02 links it instead of issuing a second tombstone; when no publication was active the field is absent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.listing.close` | bazaar.listing.close | [vault-local] { listingId, expectedRevision, closeReason, closedWithRef?, releaseHolds?, cancelDeals? } | { archiveRecordId, listingStatus: closed, tombstoneQueued, convertedHoldIds[], cancelledDealIds[] } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_ARCHIVE_HOLD_ACTIVE, PRECONDITION_FAILED | bazaar.listing.closed | yes (Idempotency-Key) |
| `bazaar.listing.archive` | bazaar.listing.archive | [vault-local] { listingId, expectedRevision, releaseHolds?, cancelDeals? } | { archiveRecordId, restoreUntil } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_ARCHIVE_HOLD_ACTIVE, PRECONDITION_FAILED | bazaar.listing.archived | yes (Idempotency-Key) |
| `bazaar.listing.restore` | bazaar.listing.restore | [vault-local] { archiveRecordId, expectedRevision } | { listingId, listingStatus: unpublished } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_ARCHIVE_RESTORE_EXPIRED | bazaar.listing.restored | yes (Idempotency-Key) |
| `bazaar.listing.expire` | bazaar.listing.expire | [vault-local, scheduler] { listingId } | { archiveRecordId?, outcome: expired\|renewed\|deferred, expiredAt?, tombstoneCid? } | NOT_FOUND, CONFLICT_STATE, PRECONDITION_FAILED | bazaar.listing.expired | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.archive_record.list_mine` | bazaar.archive_record.read | { status?, cursor?, limit <= 50 } | { items: ArchiveRecord[], nextCursor? } | VALIDATION_FAILED |
| `bazaar.archive_record.get` | bazaar.archive_record.read | { archiveRecordId } | { record: ArchiveRecord } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.listing.expired` | P0 | { listingId, ownerId, expiredAt, tombstoneCid? (set when bazaar.publication.end issued the tombstone in the expiry transaction) } |
| `bazaar.listing.archived` | P1 | { listingId, ownerId, archiveRecordId, restoreUntil } |
| `bazaar.listing.restored` | P1 | { listingId, ownerId, archiveRecordId } |
| `bazaar.listing.closed` | P0 | { listingId, ownerId, closeReason } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.inventory.depleted` | start the 7-day sold-out timer for the listing when every variant is depleted with reason sold |
| `bazaar.inventory.restocked` | cancel the sold-out timer |
| `bazaar.listing.published` | close an expired record of the listing as superseded (published again) |
| `privacy.deletion.requested` | end publications, archive all own listings, and set deletionRequestedAt so purgeAt = min(restoreUntil, request time + 30 days) |
| `privacy.deletion.completed` | replace ownerId with the payload pseudonym in records kept until evidenceUntil |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_ARCHIVE_HOLD_ACTIVE | 409 | no | listing has active inventory holds that this action may not release; params.holds names each with the required action |
| BAZAAR_ARCHIVE_RESTORE_EXPIRED | 410 | no | the 90-day restore window has passed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Purge evidence check: before apply_status to deleted the purge sweep sets keepEvidence when closedWithRef is set, when bazaar.offer.list_for_listing or bazaar.negotiation.list_mine return any retained record for the listing, or when F01.S03.M01 holds an evidence hold (linkedDealId or holderType cycle). Privacy ports (N6): the module registers ExportSectionPort (section bazaar.archive_records), DeletionPort (plan: end publications, archive, pseudonymize ownerId in records kept as evidence) and RetentionPurgePort (purgeAt and evidenceUntil sweeps) with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault.dispatch("bazaar.listing.close", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "expectedRevision": 7,
  "closeReason": "sold", "closedWithRef": { "type": "deal", "id": "0192f3a9-..." } }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000041")
=> { "archiveRecordId": "0192f3aa-...", "listingStatus": "closed", "tombstoneQueued": true, "convertedHoldIds": ["0192f3a6-..."], "cancelledDealIds": [] }
event bazaar.listing.closed { listingId, ownerId, closeReason: "sold" }   (closedWithRef stays in the ArchiveRecord)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T06 | contract | PS-001-04.R01, PS-001-04.R02, PS-001-09.R02 | each command runs | events expired, archived, restored, closed validate; consumers in F01.S04.M01 accept them |
| TEST-PS-001-09.T07 | integration | PS-001-04.R03 | expiry sweep with clock advanced one week | all overdue listings expired in one batch, one event each, expiresAt from the statement honoured |
| TEST-PS-001-09.T15 | integration | PS-001-04.R01 | stock zero for 7 days then restocked on day 6 in a second case | closed sold_out on day 7 in the first; timer cancelled in the second |
| TEST-PS-001-09.T21 | integration | PS-001-04.R04 | A expires with an active publication, then a listing whose publication already ended expires | first: bazaar.publication.end {reason expired} runs in the expiry transaction and bazaar.listing.expired carries its tombstoneCid, and the F11.S01.M02 consumer issues no second tombstone; second: the event has no tombstoneCid |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
