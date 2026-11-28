# PS-043-01 — Domain schema: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-01.R01** A RentalReturn stores reservation, parties, due time, grace, return report content with photo references, the transport receipt of the report, effective return time, late minutes and fee, attestation mode and cids, closure checks, completion signatures and state, with revision per CTR-ID-001.
- **PS-043-01.R02** Returns are P2 in both vaults, retained under RET-EVIDENCE; the late fee is integer minor units per CTR-MNY-001 computed from the terms the renter signed in the rental request and copied into the reservation.
- **PS-043-01.R03** Report revisions and attestations are immutable once signed and bind to the exact report cid.

## Specification

### RentalReturn

Schema `classrup.rentals.return/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (returnId) |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation; unique |
| ownerId | actorId — owner key |
| renterId | actorId — renter key |
| handoffReportCid | string — cid of the attested handoff report to compare with |
| dueAt | timestamp — reservation endsAt |
| graceUntil | timestamp — dueAt plus graceMinutes (0..1440) |
| checklist | ChecklistItem[] — 0..30 items as in the handoff, with the condition at return |
| photos | PhotoRef[] — 0..20 items {blobId: blob:sha256-<base64url>, attachmentId, heldLocally: boolean} |
| notes? | string — ≤ 1000 code points, plain text |
| reportCid? | string — cid of the signed return_report |
| reportCreatedAt? | timestamp — signed createdAt of the return report |
| transportAck? | object — {relayId, at} relay-signed transport receipt of the report for the owner's mailbox; the renter vault holds it from the mailbox put and the owner vault receives the same signed receipt with the fetched envelope |
| returnedAtClaim? | timestamp — time stated by the signer of the report |
| evidenceAt? | timestamp — earliest verifiable evidence: transportAck.at or the owner's signed receipt createdAt, whichever is earlier |
| effectiveReturnedAt? | timestamp — returnedAtClaim when it lies within 72 h before evidenceAt and not after evidenceAt + 5 min, else evidenceAt |
| silenceDeadline? | timestamp — max(reportCreatedAt, transportAck.at) + 72 h; unset while no transport receipt is held |
| receiptCid? | string — cid of the owner_receipt (record_received or contest) |
| receiptVerdict? | enum — received \| not_received \| differs |
| attestationCid? | string — cid of the return_attestation, or of the owner_receipt for owner_only and owner_differs |
| attestedAtClaim? | timestamp — signed createdAt of that owner statement |
| returnConditionCid? | string — reportCid when attestedBy both, receiptCid otherwise |
| attestedBy? | enum — both \| owner_only \| owner_differs |
| conflictingReportCid? | string — the renter's report when the owner's receipt differs from it |
| conditionVerdict? | enum — matches_handoff \| differences_noted |
| lateMinutes | int — 0 or more, after grace, up to effectiveReturnedAt |
| lateFee | Money — CTR-MNY-001; ≥ 0; ≤ cap; only decreasing by owner adjustment |
| lateFeeDealId? | uuid — UUIDv8 per F09.S01.M01 (explicit CTR-ID-001 ID-1 exception, derived from contextRef and contextCid); F09 Deal for contextRef {rental_late_fee, returnId} |
| damageWindowEndsAt? | timestamp — attestedAtClaim plus 7 days |
| waiverCid? | string — cid of a verified return_waiver |
| declarationCid? | string — cid of a not_returned_declaration |
| closureChecks | object — {attested, damageWindowOver: now ≥ damageWindowEndsAt + 72 h, ownerWaivedDamage, noOpenDamageClaim, depositSettled: no deposit, deposit terminal, or deposit decision overdue} |
| completionCid? | string — sha256 of JCS {reservationId, handoffReportCid, returnConditionCid, attestationCid} signed by both parties, or for the fallback the reportCid of a return attested by both |
| completionKind? | enum — rental_completion (two rental_completion signatures over completionCid) \| return_attestation (the renter's signed return_report and the owner's return_attestation over that cid) |
| completionSignatures | object[] — 0..2 {did, statementCid, closedAtClaim} |
| closeReason? | enum — completed \| deposit_unsettled \| not_returned \| owner_silent \| unresolved |
| frozenFrom? | enum — awaiting_owner \| renter_reported_unconfirmed \| attested |
| state | enum — due \| overdue \| awaiting_owner \| renter_reported_unconfirmed \| contested \| attested \| completion_pending \| frozen \| closed |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- lateFee is at most the capAmount in the reservation lateFeeTerms and never negative.
- state closed with closeReason completed or deposit_unsettled implies attested and (damageWindowOver or ownerWaivedDamage) and noOpenDamageClaim and depositSettled; deposit_unsettled exactly when the deposit was neither absent nor terminal but its decision was overdue.
- state closed with closeReason not_returned implies a not_returned damage claim ended with outcome accepted, counter_accepted, refund_claimed or dispute_unresolved or a verified not_returned_declaration is held; not_returned, owner_silent and unresolved closures carry no completionCid.
- effectiveReturnedAt is never earlier than evidenceAt minus 72 hours, and rentals.return.attested is never derived from silence.

### Storage DDL

```sql
CREATE TABLE rentals_return (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reservation_id TEXT NOT NULL, due_at TEXT NOT NULL, grace_until TEXT NOT NULL,
  state TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX rentals_return_reservation ON rentals_return(tenant_id, reservation_id);
CREATE INDEX rentals_return_due ON rentals_return(state, grace_until);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02, PS-043-03.R07 | closure with an open damage claim, a funded deposit whose decision becomes overdue, the damage window, the window plus 72 h, an owner waiver, and a deposit that expired unfunded | closed only when attested and (window plus 72 h over or waived) and no open claim and the deposit absent, terminal or decision overdue; reason deposit_unsettled when overdue; not_funded counts as settled; the waiver only re-evaluates closure and emits nothing itself |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-04.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |
| TEST-PS-043-09.T21 | unit | PS-043-01.R03 | modify a signed report or attestation, then sign a new report | signed bytes cannot change; any change is a new cid; the attestation binds only the exact earlier cid |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
