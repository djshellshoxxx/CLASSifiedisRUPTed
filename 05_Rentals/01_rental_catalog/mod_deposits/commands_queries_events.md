# PS-040-04 — Commands, queries and events: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-04.R01** All commands are vault commands; each one that the other party must rely on also produces a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-040-04.R02** One ingestion command applies inbound statements, deduplicates by cid and derives local events with actor.kind federated; failures are quarantined.
- **PS-040-04.R03** Payment status is derived only from F09 events whose contextRef is {rental_deposit, depositId} or {rental_deposit_release, depositId} of this module; the module never creates or alters a PaymentClaim itself.
- **PS-040-04.R04** Every money obligation is a separate commerce.deal.open call with its own contextRef and contextCid (funding at agreement, release at the release attestation); no other payment context API is used.
- **PS-040-04.R05** Statements the counterparty must act on (withdrawal, decline, dispute notice, renegotiation) are named schemas with signer roles registered in F11.S01.M01 and handled by receive, and an agreement received after a withdrawal fails with CONFLICT_STATE in both vaults.
- **PS-040-04.R06** comms.consent.revoked is matched through its revokedIds[] against the agreementCid, its revocationId is recorded and afterCommit is cross-checked with comms.consent.verify, whose result decides; an agreed deposit never freezes on the event alone and a funded or later deposit keeps its state because the payment already happened under the agreement.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.deposit.propose` | rentals.deposit.propose | [statement classrup.rentals.deposit_terms/v1 signed by owner, E2E encrypted to renter] { reservationId, amount, method, dueBy? } (declaredValue is copied from the signed rental request) | { depositId, termsCid, syncState } | NOT_FOUND, VALIDATION_FAILED, RENTALS_DEPOSIT_DUPLICATE, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `rentals.deposit.agree` | rentals.deposit.agree | [comms.consent.sign {subjectType rentals_deposit, subjectRef depositId, subjectRevision 1, subjectRevisionHash of termsCid, statementKey consent.rentals.deposit.agree.v1, statementTextHash of its registered non-custody wording}, E2E encrypted to the owner; the owner vault opens the funding Deal on receipt] { depositId, expectedRevision, termsCid } | { depositId, revision, agreementCid, fundingDealId (deterministic from contextRef and contextCid), syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_DEPOSIT_TERMS_STALE, EXPIRED, COMMS_CONSENT_STATEMENT_UNKNOWN, DEPENDENCY_UNAVAILABLE | rentals.deposit.agreed | yes (Idempotency-Key) |
| `rentals.deposit.withdraw` | rentals.deposit.withdraw | [statement classrup.rentals.deposit_withdrawal/v1 signed by the owner (withdrawal) or the renter (decline) over termsCid] { depositId, expectedRevision } | { depositId, revision, withdrawalCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | rentals.deposit.released | yes (Idempotency-Key) |
| `rentals.deposit.attest_release` | rentals.deposit.release | [statement classrup.rentals.deposit_release_attestation/v1 signed by owner, then commerce.deal.open {contextRef {rental_deposit_release, depositId}, contextCid the attestation cid, one obligation owner to renter of releaseAmount, purpose deposit}] { depositId, expectedRevision, releaseAmount } | { depositId, revision, releaseAttestationCid, releaseDealId, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `rentals.deposit.claim_forfeit` | rentals.deposit.forfeit | [statement classrup.rentals.forfeit_claim/v1 signed by owner, E2E encrypted to renter, carrying the absolute respondBy] { depositId, expectedRevision, amount, reason, damageClaimId?, evidenceRefs[] } | { depositId, revision, claimCid, respondBy, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_FORFEIT_EXCEEDS_DEPOSIT, RENTALS_DEPOSIT_WINDOW, VALIDATION_FAILED | rentals.deposit.forfeit_claimed | yes (Idempotency-Key) |
| `rentals.deposit.respond_forfeit` | rentals.deposit.respond | [statement classrup.rentals.forfeit_response/v1 signed by renter over the claim cid] { depositId, expectedRevision, claimCid, response: accepted\|partial\|disputed, acceptedAmount? } | { depositId, revision, responseCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, EXPIRED | rentals.deposit.released | yes (Idempotency-Key) |
| `rentals.deposit.dispute` | rentals.deposit.dispute | [vault command on explicit user action by the designated opener; calls F09.S02.M02 commerce.dispute.open {contextRef {type rental_deposit, id depositId}, reason, evidence the user selects}; sends classrup.rentals.deposit_dispute_notice/v1 signed by the opener to the other party] { depositId, expectedRevision, statement } | { depositId, revision, disputeCaseId?, noticeCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE, VALIDATION_FAILED, FORBIDDEN |  | yes (Idempotency-Key) |
| `rentals.deposit.renegotiate` | rentals.deposit.renegotiate | [statement classrup.rentals.deposit_renegotiation/v1 signed by the proposing party naming the statements that stand, co-signed by the other over the same cid] { depositId, expectedRevision, standingCids[], releaseAmount?, renegotiationCid? } | { depositId, revision, renegotiationCid, signatures: 1 \| 2, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.deposit.receive` | rentals.deposit.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001; on an accepted agreement the owner vault calls commerce.deal.open {contextRef {rental_deposit, depositId}, contextCid agreementCid, parties [{did ownerId, role owner}, {did renterId, role renter}], one obligation renter to owner of amount, purpose deposit, expiresInDays ceil((dueBy − now) / 1 d) + 14}] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_DEPOSIT_TERMS_STALE, CONFLICT_STATE, EXPIRED | rentals.deposit.agreed, rentals.deposit.forfeit_claimed, rentals.deposit.released | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.deposit.get` | rentals.deposit.read_own | [vault-local] { depositId } | { deposit: DepositTerms, proof: none\|claimed\|acknowledged\|confirming\|final\|disputed\|expired, decisionOverdue } | NOT_FOUND |
| `rentals.deposit.get_for_reservation` | rentals.deposit.read_own | [vault-local] { reservationId } | { deposit?: DepositTerms, terminal: boolean, decisionOverdue: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.deposit.agreed` | P2 | { depositId, reservationId, ownerId, renterId, amount, method, termsCid, agreementCid, fundingDealId } |
| `rentals.deposit.released` | P2 | { depositId, reservationId, ownerId, renterId, outcome: released_full\|released_partial\|retained_full\|not_funded, releasedAmount, retainedAmount, damageClaimId? } |
| `rentals.deposit.forfeit_claimed` | P2 | { depositId, reservationId, ownerId, renterId, amount, reason, damageClaimId?, claimCid, respondBy } |
| `rentals.deposit.funded` | P2 | { depositId, reservationId, ownerId, renterId, amount, proof } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.claimed` | for contextRef {rental_deposit, depositId} or {rental_deposit_release, depositId} show proof claimed (unverified) |
| `commerce.payment.acknowledged` | for contextRef.type rental_deposit move agreed to funded; for rental_deposit_release move release_pending to released |
| `commerce.payment.finalized` | same as acknowledged for crypto payments with chain finality (F09.S01.M03) |
| `commerce.payment.expired` | show proof expired; funding stays unfunded; the release stays pending and can be disputed by the renter |
| `commerce.deal.cancelled` | for the funding Deal of a withdrawn deposit, record the cancellation as complete |
| `commerce.dispute.opened` | for contextRef exactly {rental_deposit, depositId}, link the case and move escalated_pending to disputed |
| `commerce.dispute.resolved` | for contextRef exactly {rental_deposit, depositId}, apply the outcome mapping in the note |
| `commerce.dispute.withdrawn` | for contextRef exactly {rental_deposit, depositId}, return the deposit to disputedFrom |
| `comms.consent.revoked` | for subjectType rentals_deposit, when revokedIds[] contains the agreementCid of the deposit subjectRef names, store revocationId as agreementRevocationId and call comms.consent.verify (afterCommit true expects conflicted, false expects revoked; the verify result decides); on conflicted or revoked freeze an agreed deposit with frozenFrom agreed, while a funded or later deposit records the revocation as evidence without a state change; ids that match no agreement and a replayed revocationId change nothing |
| `rentals.reservation.cancelled` | expire unfunded terms (emitting not_funded for agreed terms), or move funded terms to release_pending for a full release |
| `rentals.return.attested` | store the signed attestation time and start the 7 day soft decision clock |
| `rentals.rental.overdue` | record overdueSince; 14 days later a forfeit with reason not_returned becomes allowed without a return attestation |
| `rentals.damage.claimed` | record the claim id and kind so a forfeit for damage or missing parts can reference it |
| `rentals.damage.resolved` | record resolvedAt, outcome and agreedAmount (extending the forfeit window to 14 days after it and bounding a forfeit for that claim) and prefill a forfeit claim from an agreed amount; the owner still signs the claim |
| `identity.block.added` | suppress notifications for the counterparty through filterBlocked; statements for reservations confirmed before the block are still verified and stored |
| `privacy.deletion.completed` | replace the deleted party's DID in retained deposit records and statement metadata with the deletion pseudonym; signed statements are kept so signatures still verify |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_DEPOSIT_DUPLICATE | 409 | no | live deposit terms already exist for this reservation |
| RENTALS_DEPOSIT_TERMS_STALE | 409 | no | agreement names terms that are not current, or its consent does not verify |
| RENTALS_FORFEIT_EXCEEDS_DEPOSIT | 422 | no | forfeit amount is higher than the funded deposit |
| RENTALS_DEPOSIT_WINDOW | 409 | no | forfeit is outside its allowed window, or damage claims were waived at return |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles registered in F11.S01.M01 (N2): classrup.rentals.deposit_terms/v1 (owner), classrup.rentals.deposit_withdrawal/v1 (owner for a withdrawal, renter for a decline), classrup.rentals.deposit_release_attestation/v1 (owner), classrup.rentals.forfeit_claim/v1 (owner), classrup.rentals.forfeit_response/v1 (renter), classrup.rentals.deposit_dispute_notice/v1 (the designated opener, owner or renter), classrup.rentals.deposit_renegotiation/v1 (owner and renter, both signatures over one cid). Agreement (N13): classrup.comms.consent/v1 with subjectType rentals_deposit, subjectRef depositId, subjectRevisionHash from this module's SubjectCanonicalizerPort over the terms statement, statementKey consent.rentals.deposit.agree.v1 whose registered wording states that the owner, not ClassRup, holds the deposit; comms.consent.verify statuses conflicted or revoked freeze the deposit. Deals (N5): funding {rental_deposit, depositId} renter to owner, contextCid agreementCid; release {rental_deposit_release, depositId} owner to renter, contextCid the release attestation cid; both are opened by the owner vault, and payment events are matched on contextRef.type and id (V08). This module implements the F09.S01.M01 ContextTermsPort for rental_deposit and rental_deposit_release - verify recomputes the parties and the single obligation from the verified agreement consent and terms (funding) or from the release attestation and the releaseAmount fixed by the path (release), openerRole and ownerRole are owner. Disputes: contextRef {rental_deposit, depositId}; commerce.dispute.opened, resolved and withdrawn are applied only when their contextRef matches exactly. Outcome mapping: refund_claimed or return_agreed accepted by both parties -> releaseAmount = min(advisoryRefund, funded) or funded when absent (forfeited only when that is 0), where advisoryRefund in a {rental_deposit} case is always the amount the owner returns to the renter, whichever party opened; no_fault_close, enforcement_referral, lapsed -> funded with decisionOverdue; withdrawn -> disputedFrom. Draft cases: the prefilled commerce.dispute.open input (reason, description, selected evidence) is held in this vault, and F09.S02.M02 sees nothing until the designated opener opens it. WaiverStatusPort: declared here and registered by F05.S02.M02 at composition, so the waiver check needs no dependency edge on the return module. Blocks (N7): every statement for a reservation confirmed before a block (proposal, agreement, release, claim, response, notice) is still verified and stored with notifications suppressed through F07.S02.M02 filterBlocked, and isBlockedEither gates only new initiations, so a block can never strand a deposit.

### Example

```
owner vault: rentals.deposit.propose { "reservationId": "0192f500-0002-…", "amount": { "amount": "10000", "currency": "EUR" }, "method": "cash" }
  -> { "depositId": "0192f510-0001-…", "termsCid": "sha256-Dt…" }
renter vault: rentals.deposit.agree { "termsCid": "sha256-Dt…" } -> comms.consent.sign (consent.rentals.deposit.agree.v1)
owner vault receives and verifies the agreement -> commerce.deal.open { "contextRef": { "type": "rental_deposit", "id": "0192f510-0001-…" }, "contextCid": "sha256-Ag…" } -> fundingDealId
renter pays cash and records a claim; owner acknowledges it in F09 -> commerce.payment.acknowledged -> state funded
after return: owner rentals.deposit.attest_release { "releaseAmount": { "amount": "10000", "currency": "EUR" } }
  -> commerce.deal.open { "contextRef": { "type": "rental_deposit_release", "id": "0192f510-0001-…" } } -> release_pending until the renter acknowledges receipt
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T04 | integration | PS-040-03.R02, PS-040-04.R03 | payment claimed only, confirming only, expired, then acknowledged | funded only at acknowledged or final; proof labels follow COM-4 |
| TEST-PS-040-09.T07 | integration | PS-040-04.R01, PS-040-04.R02, PS-040-06.R01, PS-040-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on released with identical cids; duplicates skipped |
| TEST-PS-040-09.T08 | contract | PS-040-04.R01, PS-040-04.R02, PS-040-04.R04 | each command, statement, consent, Deal call and event | payloads and signatures validate against registry schemas and signer roles; funding and release Deals are opened by the owner vault and carry contextRef {rental_deposit, depositId} with contextCid agreementCid and {rental_deposit_release, depositId} with the attestation cid; fundingDealId and releaseDealId are stored as the UUIDv8 values F09.S01.M01 derives; the renter vault derives the same fundingDealId before the Deal arrives and its ContextTermsPort.verify accepts both Deals |
| TEST-PS-040-09.T12 | integration | PS-040-03.R05, PS-040-04.R03 | reservation cancelled after funding, owner attests on day 40 | deposit moves to release_pending with the full amount and no release Deal; attest_release allowed without return attestation and after day 30; released after the renter acknowledges |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-04.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody wording shown and signed; axe zero serious issues |
| TEST-PS-040-09.T22 | integration | PS-040-04.R05 | owner withdraws the terms while the renter agrees concurrently | both vaults end withdrawn; the agreement fails with CONFLICT_STATE in both; rentals.deposit.released with not_funded emitted once per vault |
| TEST-PS-040-09.T25 | integration | PS-040-04.R06, PS-040-03.R01 | comms.consent.revoked whose revokedIds[] holds the agreementCid of an agreed deposit with afterCommit false; the same for a funded deposit with afterCommit true; one naming an unrelated consent; the first revocationId replayed | the agreed deposit frozen with frozenFrom agreed and agreementRevocationId set after comms.consent.verify returns revoked; the funded deposit keeps its state with the revocation recorded; the unrelated and replayed cases change nothing |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
