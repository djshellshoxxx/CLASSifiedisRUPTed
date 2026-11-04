# PS-042-01 — Domain schema: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-01.R01** A RentalHandoff stores reservation, parties, checklist items, readings, photo references with hashes, notes, revision, signatures and state, with revision per CTR-ID-001.
- **PS-042-01.R02** Handoffs are P2 and kept under RET-EVIDENCE; photos are encrypted attachments referenced by id and SHA-256 and never embedded.
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
| reportRevision | int — 1..6; increments on each new signed report |
| checklist | ChecklistItem[] — 1..30 items {id, label ≤ 80, condition: ok \| worn \| damaged \| missing \| na, note? ≤ 200, photoIds? ≤ 3} |
| readings | Reading[] — 0..5 items {label ≤ 40, value: number, unit ≤ 10} |
| photos | PhotoRef[] — 0..20 items {attachmentId, sha256, takenAtClaim?} |
| notes? | string — ≤ 1000 code points, plain text |
| reportCid? | string — sha256- cid of the latest signed report statement |
| authorId? | actorId — signer of the latest report |
| attestations | Attestation[] — 0..2 items {signerId, reportCid, attestationCid, claimedAt, receivedAt} |
| changeRounds | int — 0..5 |
| attestedAt? | timestamp — local time when both signatures were first held |
| state | enum — drafting \| awaiting_counterparty \| attested \| expired \| cancelled |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- state attested implies two attestations by owner and renter on the same reportCid.
- Every photo reference has a 64-hex SHA-256 and no embedded bytes.
- A new reportRevision clears attestations that name an earlier cid.

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
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip EXIF, sign it | hashes computed after stripping; no GPS in stored bytes; cid stable |
| TEST-PS-042-09.T04 | integration | PS-042-03.R02, PS-042-01.R03 | attest revision 2 after revision 3 exists; request changes then re-attest | RENTALS_REPORT_STALE; new revision clears attestations; attested only on the exact cid |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-02.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
