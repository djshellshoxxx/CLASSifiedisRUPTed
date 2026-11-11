# PS-042-01 — Domain schema: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-01.R01** A RentalHandoff stores reservation, parties, checklist items, readings, photo references, notes, revision, signatures and state, with revision per CTR-ID-001.
- **PS-042-01.R02** Handoffs are P2 and kept under RET-EVIDENCE; photos are encrypted F08.S01.M03 attachments referenced by MediaBlob id (blob:sha256-…) and attachment id, never embedded, and each vault keeps its own verified copy of every referenced photo as evidence.
- **PS-042-01.R03** A report revision is immutable once signed; any change is a new revision with a new cid, and attestations bind to one cid.

## Specification

### RentalHandoff

Schema `classrup.rentals.handoff/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation; unique |
| ownerId | actorId — owner key |
| renterId | actorId — renter key |
| startsAt | timestamp — copied from rentals.reservation.confirmed; anchors the window |
| reportRevision | int — 1..6; increments on each new signed report |
| checklist | ChecklistItem[] — 1..30 items {id from the reservation checklistTemplate, label ≤ 80, condition: ok \| worn \| damaged \| missing \| na, note? ≤ 200, photoIds? ≤ 3} |
| readings | Reading[] — 0..5 items {label ≤ 40, value: number, unit ≤ 10} |
| photos | PhotoRef[] — 0..20 items {blobId: blob:sha256-<base64url> (F15.S02.M03 MediaBlob id), attachmentId: F08.S01.M03 attachment id, takenAtClaim?, heldLocally: boolean} |
| notes? | string — ≤ 1000 code points, plain text |
| reportCid? | string — sha256- cid of the latest signed report statement |
| authorId? | actorId — signer of the latest report |
| signedReportHeld | boolean — a report signed by either party is held in this vault |
| attestations | Attestation[] — 0..2 items {signerId, reportCid, attestationCid, createdAtClaim, receivedAt} |
| changeRounds | int — 0..5 |
| attestedAt? | timestamp — local time when both signatures were first held |
| expiryReason? | enum — no_report \| unattested |
| state | enum — drafting \| awaiting_counterparty \| frozen \| attested \| expired \| cancelled |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- state attested implies two attestations by owner and renter on the same reportCid and every referenced photo held and verified locally.
- Every photo reference is a MediaBlob id with no embedded bytes.
- A new reportRevision clears attestations that name an earlier cid.
- expiryReason no_report implies no report signed by either party was held at startsAt plus 96 hours.

### Storage DDL

```sql
CREATE TABLE rentals_handoff (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reservation_id TEXT NOT NULL, state TEXT NOT NULL,
  report_revision INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX rentals_handoff_reservation ON rentals_handoff(tenant_id, reservation_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip metadata through F10.S02.M03 before encryption, sign it | MediaBlob ids computed over the stripped bytes; no metadata in stored or sent bytes; cid stable |
| TEST-PS-042-09.T04 | integration | PS-042-03.R02, PS-042-01.R03 | attest revision 2 after revision 3 exists; request changes then re-attest | RENTALS_REPORT_STALE; new revision clears attestations; attested only on the exact cid |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-04.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |
| TEST-PS-042-09.T18 | integration | PS-042-07.R04, PS-042-01.R02, PS-042-04.R05 | relay blob of one photo expired before the renter fetched it; author deletes the thread message after the renter stored the other photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND, the photo is listed in missingPhotos[] and re-requested, and attest is refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify against their MediaBlob ids after the deletion |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
