# PS-043-04 — Commands, queries and events: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-04.R01** Vault commands report, attest, record_received, contest, adjust_late_fee, waive_damage, declare_not_returned, sign_completion and renegotiate each produce a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-043-04.R02** One ingestion command applies inbound statements, deduplicates by cid, fetches and verifies referenced photos, derives local events with actor.kind federated and quarantines failures.
- **PS-043-04.R03** Overdue, attested and closed events are local (EVT-8); each vault derives them from its own data and clock and from the signed statements and relay receipts it holds.
- **PS-043-04.R04** The late fee is a noncustodial Deal {rental_late_fee, returnId} opened by the owner vault through commerce.deal.open at attestation, statement schemas are registered with signer roles in F11.S01.M01, and the receiving vault acts only on statements it accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.return.report` | rentals.return.report | [statement classrup.rentals.return_report/v1 signed by renter, E2E encrypted to owner] { reservationId, checklist, photos?, notes?, returnedAtClaim } | { returnId, reportCid, lateMinutes, lateFee: Money (preview until a transport receipt is held), syncState } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, COMMS_ATTACHMENT_TOO_LARGE, RENTALS_PHOTO_METADATA |  | yes (Idempotency-Key) |
| `rentals.return.attest` | rentals.return.attest | [statement classrup.rentals.return_attestation/v1 signed by owner over the exact report cid; when lateFee > 0 then commerce.deal.open {contextRef {rental_late_fee, returnId}, contextCid attestationCid, one obligation renter to owner, purpose other}] { returnId, expectedRevision, reportCid, conditionVerdict, lateFee? (≤ computed) } | { returnId, revision, attestationCid, attestedAtClaim, lateFeeDealId?, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE, RENTALS_EVIDENCE_MISSING, RENTALS_FEE_ADJUST_INVALID, DEPENDENCY_UNAVAILABLE | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.record_received` | rentals.return.attest | [statement classrup.rentals.owner_receipt/v1 signed by owner with verdict received; late-fee Deal as for attest with contextCid receiptCid] { returnId, expectedRevision, receivedAtClaim, checklist (1..30), photos?, notes?, conditionVerdict, lateFee? (≤ computed) } | { returnId, revision, receiptCid, lateMinutes, lateFee: Money, lateFeeDealId?, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_EVIDENCE_MISSING, COMMS_ATTACHMENT_TOO_LARGE, DEPENDENCY_UNAVAILABLE | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.contest` | rentals.return.attest | [statement classrup.rentals.owner_receipt/v1 signed by owner over the report cid with verdict not_received or differs] { returnId, expectedRevision, reportCid, verdict: not_received \| differs, receivedAtClaim? (differs), checklist? (1..30, required for differs), photos?, notes? } | { returnId, revision, receiptCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_REPORT_STALE, RENTALS_EVIDENCE_MISSING | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.adjust_late_fee` | rentals.return.adjust_fee | [statement classrup.rentals.late_fee_adjustment/v1 signed by owner; after the late-fee Deal is opened only newLateFee 0, carried out by commerce.deal.cancel signed by both parties] { returnId, expectedRevision, newLateFee: Money, reason } | { returnId, revision, lateFee: Money, dealCancelPending?, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_FEE_ADJUST_INVALID |  | yes (Idempotency-Key) |
| `rentals.return.waive_damage` | rentals.return.adjust_fee | [statement classrup.rentals.return_waiver/v1 signed by owner; only re-evaluates closure] { returnId, expectedRevision } | { returnId, revision, waiverCid, closureChecks, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `rentals.return.declare_not_returned` | rentals.return.declare | [statement classrup.rentals.not_returned_declaration/v1 signed by owner] { returnId, expectedRevision, note? (≤ 500) } | { returnId, revision, declarationCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED | rentals.rental.closed | yes (Idempotency-Key) |
| `rentals.return.sign_completion` | rentals.return.complete | [statement classrup.rentals.rental_completion/v1 signed by this party over the completionCid; invoked by the closure evaluation and available manually] { returnId, expectedRevision, completionCid } | { returnId, revision, completionCid, signatures: 1 \| 2, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED | rentals.rental.closed | yes (Idempotency-Key) |
| `rentals.return.renegotiate` | rentals.return.renegotiate | [statement classrup.rentals.return_renegotiation/v1 signed by the proposing party naming the owner statement that stands or voiding the forked ones, co-signed by the other over the same cid] { returnId, expectedRevision, standingCid?, voidCids[], renegotiationCid? } | { returnId, revision, renegotiationCid, signatures: 1 \| 2, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.receive` | rentals.return.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001, including relay-signed transport receipts; fetches and verifies referenced photos] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_REPORT_STALE, RENTALS_PHOTO_METADATA, VALIDATION_FAILED, CONFLICT_STATE | rentals.return.attested, rentals.rental.overdue, rentals.rental.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.return.get` | rentals.return.read_own | [vault-local] { returnId } | { return: RentalReturn, diffFromHandoff: ChecklistDiff, closureChecks, deliveryLabel: not_yet_delivered \| relay_received \| owner_responded, missingPhotos[] } | NOT_FOUND |
| `rentals.return.get_for_reservation` | rentals.return.read_own | [vault-local] { reservationId } | { return?: RentalReturn, waiverCid?, provenance?: bilateral \| owner_only \| renter_only } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.return.attested` | P2 | { returnId, reservationId, ownerId, renterId, reportCid?, returnConditionCid, attestationCid, attestedAtClaim, effectiveReturnedAt, attestedBy, conditionVerdict, conflictingReportCid?, lateMinutes, lateFee } |
| `rentals.rental.overdue` | P2 | { reservationId, returnId, ownerId, renterId, dueAt, graceUntil, detectedAt } |
| `rentals.rental.closed` | P2 | { contextId (= reservationId), reservationId, returnId, completionCid?, completionKind?: rental_completion\|return_attestation, oneSided: boolean, parties: [{did: ownerId, role: owner}, {did: renterId, role: renter}], ownerId, renterId, closedAt, reason: completed\|deposit_unsettled\|not_returned\|owner_silent\|unresolved } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | create the RentalReturn in state due with dueAt from the reservation, the parties and the handoff report cid |
| `rentals.damage.claimed` | mark an open damage claim so closure waits |
| `rentals.damage.resolved` | clear the open damage claim and re-evaluate closure; for kind not_returned with outcome accepted, counter_accepted, refund_claimed or dispute_unresolved close an overdue or contested return with reason not_returned |
| `rentals.deposit.agreed` | mark a deposit pending for the closure check |
| `rentals.deposit.funded` | keep the deposit pending until it is released, forfeited or its decision is overdue (read through rentals.deposit.get_for_reservation) |
| `rentals.deposit.released` | mark the deposit settled, including outcome not_funded, and re-evaluate closure |
| `commerce.deal.cancelled` | for contextRef {rental_late_fee, returnId} record the waiver as complete and set lateFee to 0 |
| `comms.attachment.deleted` | no effect on photo copies already stored as evidence; a photo not yet fetched is marked missing and re-requested |
| `identity.block.added` | suppress notifications for the counterparty through filterBlocked; return statements for reservations confirmed before the block are still verified and stored and the clocks keep running |
| `privacy.deletion.completed` | replace the deleted party's DID in retained returns and statement metadata with the deletion pseudonym; signed statements and photo copies are kept so signatures and hashes still verify |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_FEE_ADJUST_INVALID | 422 | no | a late fee can only be lowered before its Deal is opened, or waived afterwards |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles registered in F11.S01.M01 (N2): classrup.rentals.return_report/v1 (renter), classrup.rentals.return_attestation/v1 (owner), classrup.rentals.owner_receipt/v1 (owner; verdict received, not_received or differs), classrup.rentals.late_fee_adjustment/v1 (owner), classrup.rentals.return_waiver/v1 (owner), classrup.rentals.not_returned_declaration/v1 (owner), classrup.rentals.return_renegotiation/v1 (owner and renter, both signatures over one cid), classrup.rentals.rental_completion/v1 (owner and renter, each signs the same deterministic completionCid = sha256 of JCS {reservationId, handoffReportCid, returnConditionCid, attestationCid}; each signer's closedAtClaim is carried in its own statement). Completion (N3): rentals.rental.closed carries completionCid only when both parties' signatures cover it - two rental_completion statements (completionKind rental_completion) or, after 7 days without the counterparty's completion signature, the reportCid of a return attested by both, signed by the renter as the return_report and by the owner through the return_attestation over it (completionKind return_attestation) - so F07.S03.M01 can verify both signatures and neither party can block the other's review by withholding a signature; closures without such a cid omit it and set oneSided true so no review window opens. Deals (N5): late fee {rental_late_fee, returnId}, contextCid the attestation or receipt cid, opened by the owner vault; this module implements the F09.S01.M01 ContextTermsPort for rental_late_fee - verify recomputes the single renter-to-owner obligation from the signed lateFeeTerms of the request, the effective return time and any late_fee_adjustment, openerRole and ownerRole are owner - so the renter vault quarantines a Deal whose amount differs and flags the mismatch. Ports: this module registers the WaiverStatusPort declared by F05.S01.M02 and reads F05.S01.M02 rentals.deposit.get_for_reservation for the deposit closure check. Photos (N9): F08.S01.M03 attachments of at most 5 MiB with metadata stripped through F10.S02.M03 before encryption, referenced by MediaBlob ids that travel only inside encrypted statements while relays hold only ciphertext; each vault keeps verified local copies under RET-EVIDENCE. Blocks (N7): return statements for a reservation confirmed before a block are verified and stored and their clocks run; only notifications are suppressed, through F07.S02.M02 filterBlocked, and isBlockedEither is never used to drop them.

### Example

```
renter vault: rentals.return.report { "reservationId": "0192f500-0002-…", "checklist": [{ "id": "tent-body", "label": "Tent body", "condition": "ok" }],
  "returnedAtClaim": "2026-12-07T12:10:00.000Z" } -> { "returnId": "0192f530-0001-…", "lateMinutes": 130, "lateFee": { "amount": "1500", "currency": "EUR" } }
(reservation end 09:00 UTC, grace 60 min, rate EUR 5.00 per hour: lateMinutes 130, ceil(130/60) = 3 hours, fee EUR 15.00)
relay relay.example.org acknowledges the report at 12:12 UTC -> transportAck set, silenceDeadline 2026-12-10T12:12Z
owner vault: rentals.return.attest { "reportCid": "sha256-Rt…", "conditionVerdict": "matches_handoff" } -> rentals.return.attested;
  commerce.deal.open { "contextRef": { "type": "rental_late_fee", "id": "0192f530-0001-…" } }
after the damage window plus 72 h both vaults sign the completion -> rentals.rental.closed with completionCid and parties
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02, PS-043-03.R07 | closure with an open damage claim, a funded deposit whose decision becomes overdue, the damage window, the window plus 72 h, an owner waiver, and a deposit that expired unfunded | closed only when attested and (window plus 72 h over or waived) and no open claim and the deposit absent, terminal or decision overdue; reason deposit_unsettled when overdue; not_funded counts as settled; the waiver only re-evaluates closure and emits nothing itself |
| TEST-PS-043-09.T08 | integration | PS-043-04.R01, PS-043-04.R02, PS-043-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested and closed with identical cids; duplicates skipped |
| TEST-PS-043-09.T09 | contract | PS-043-04.R01, PS-043-04.R03, PS-043-04.R04 | each command, statement and event | payloads and signatures validate against registry schemas and signer roles; rentals.rental.closed carries contextId, parties and completionCid when bilateral; the late-fee Deal carries contextRef {rental_late_fee, returnId} |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-04.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
