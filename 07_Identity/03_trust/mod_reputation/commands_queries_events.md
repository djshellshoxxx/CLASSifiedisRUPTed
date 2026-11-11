# PS-058-04 — Commands, queries and events: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-04.R01** post, withdraw and hide are vault commands; post produces the signed statement classrup.identity.review/v1, the opening and outcome handlers produce classrup.identity.review_ticket/v1, and withdraw produces classrup.federation.tombstone/v1, all signed by a device key and signed and stored only through the F11.S01.M01 StatementPublisherPort (publish for reviews and tickets, issueTombstone for withdrawals, implemented by F11.S01.M02); receive and review_ticket.receive are the vault intakes of someone else's statements.
- **PS-058-04.R02** Opening, completion, dispute, cycle recovery and cancellation events open or update review windows using their N3 fields (contextId, completionCid, parties with roles, legs for cycles, reviewUnlock for cycle recoveries), and a completion opens a window only after the completion statements behind completionCid verify in this vault (V13); they never create reviews by themselves, and a missing field or statement quarantines the window rather than guessing.
- **PS-058-04.R03** Every command emits its events in the same local transaction as the state change.
- **PS-058-04.R04** No-show claims from comms.meetup.no_show are recorded and displayed as claims with zero weight in rep-1, a claim contradicted by the accused's check-in (comms.meetup.no_show_contradicted, or contradicted true on arrival) is displayed together with that check-in statement, and neither creates reviews.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.review.post` | identity.review.post | { contextType, contextId, subjectDid, rating, tags?, comment?, audience: subject_only\|public, targetRelays? } | { reviewId, cid, pairRef, statement: classrup.identity.review/v1, syncState: local_committed, skippedRelays: array } | VALIDATION_FAILED, IDENTITY_REVIEW_NOT_ELIGIBLE, IDENTITY_REVIEW_DUPLICATE, IDENTITY_REVIEW_WINDOW_CLOSED, IDENTITY_REVIEW_PROOF_INCOMPLETE, BLOCKED_PARTY, PRECONDITION_FAILED, RATE_LIMITED | identity.review.posted | yes (Idempotency-Key) |
| `identity.review.receive` | identity.review.receive | { statement: classrup.identity.review/v1, provenance } | { reviewId, status: posted\|quarantined, quarantineReason? } | IDENTITY_REVIEW_SIGNATURE_INVALID, IDENTITY_REVIEW_PROOF_INCOMPLETE, IDENTITY_REVIEW_NOT_ELIGIBLE, IDENTITY_REVIEW_DUPLICATE, IDENTITY_REVIEW_WINDOW_CLOSED, VALIDATION_FAILED, RATE_LIMITED | identity.review.posted | yes (Idempotency-Key) |
| `identity.review_ticket.receive` | identity.review_ticket.receive | { ticket: classrup.identity.review_ticket/v1, provenance } | { windowId, phase: opening\|completion, status: stored\|quarantined } | IDENTITY_REVIEW_SIGNATURE_INVALID, IDENTITY_REVIEW_NOT_ELIGIBLE, VALIDATION_FAILED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.review.withdraw` | identity.review.withdraw | { reviewId, expectedRevision } | { reviewId, revision, tombstone: classrup.federation.tombstone/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.reputation.recomputed | yes (Idempotency-Key) |
| `identity.review.hide` | identity.review.hide_local | { reviewId, hidden: boolean, expectedRevision } | { reviewId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.reputation.recomputed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.reputation.get` | identity.reputation_summary.read | { subjectDid } | { summary: ReputationSummary, note: 'based on reviews seen by this device' } | NOT_FOUND |
| `identity.review.list_for_subject` | identity.review.read | { subjectDid, status?: posted\|hidden, outcome?: completed\|disputed\|cancelled, cursor?, limit? (1..50) } | { items: Review[], nextCursor? } | NOT_FOUND |
| `identity.review.list_eligible` | identity.review_window.read_own | { cursor?, limit? (1..50) } | { items: [{ windowId, contextType, contextId, subjectDid, outcome, publicAllowed: boolean (subject ticket held), closesAt }], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.review.posted` | P1 | { reviewId, contextType, pairRef, authorDid, subjectDid, rating, outcome, origin } |
| `identity.reputation.recomputed` | P1 | { subjectDid, reviewCount, selectedReviewCount, bayesianAvg, effectiveWeight, outcomeCounts, noShowClaims, algorithmVersion } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.opened` | create a pending ReviewWindow when the principal is in parties[]; sign an opening ticket for the counterparty and send it end-to-end encrypted through the sync outbox; relies on contextCid and parties [{did, role}], and without them no ticket is signed and the window waits |
| `mutiny.cycle.committed` | create a pending window; sign opening tickets only for leg-connected counterparties; relies on revisionHash as contextCid, parties [{did, role}] and legs |
| `services.booking.confirmed` | create a pending window for the client and provider pair; relies on contextCid and parties [{did, role}] |
| `rentals.reservation.confirmed` | create a pending window for the owner and renter pair; relies on confirmationCid as contextCid and parties [{did, role}] |
| `commerce.deal.completed` | open the window with outcome completed and sign completion tickets once a classrup.commerce.deal_completion/v1 by every party over completionCid (the cid of the completion body { dealId, dealCid, outcome completed }) verifies; relies on contextId, completionCid and parties [{did, role}] (N3); a missing field or statement quarantines the window |
| `mutiny.cycle.completed` | open the window with leg-connected pairs and outcome completed; relies on contextId, completionCid, receiptCids, parties [{did, role}] and legs [{legId, giverId, receiverId}] (N3); the proof is completionCid with receiptCids, each a verified received handover attestation of one leg |
| `services.booking.completed` | open the window for the client and provider pair with outcome completed once both classrup.services.booking_completion/v1 statements, the client's and the provider's, over completionCid verify; relies on contextId (bookingId), contextType booking, completionCid and parties [{did, role: client\|provider}] (N3) |
| `rentals.rental.closed` | open the window for the owner and renter pair with outcome completed only when reason is completed or deposit_unsettled, completionCid is present and oneSided is false, after the proof verifies - completionKind rental_completion: classrup.rentals.rental_completion/v1 by the owner and by the renter over completionCid; completionKind return_attestation: completionCid is the renter's classrup.rentals.return_report/v1 and the owner's classrup.rentals.return_attestation/v1 is over it; relies on contextId, completionCid, completionKind, oneSided and parties [{did, role: owner\|renter}] (N3); one-sided closures and other reasons open no window |
| `commerce.dispute.resolved` | resolution lapsed (the FLOW-08 closed-unresolved outcome) - open or update the window with outcome disputed and disputeFlag true; the proof is the subject's opening ticket plus the dispute caseCid; relies on contextRef, caseCid and parties [{did, role}], which commerce.dispute.withdrawn also carries |
| `mutiny.recovery.resolved` | cycle recovery (FLOW-08) with reviewUnlock.unlocked - outcome unresolved or dispute_outcome opens or updates the cycle window with outcome disputed and disputeFlag true, outcome agreed opens it with outcome cancelled; pairs are leg-connected; relies on contextId (cycleId), parties [{did, role}], legs [{legId, giverId, receiverId}] and reviewUnlock { unlocked, disputeFlag, evidenceCids }, whose evidenceCids are the proof |
| `commerce.deal.cancelled` | open the window with outcome cancelled when opening tickets were exchanged for the deal; relies on contextRef and parties [{did, role}] |
| `comms.meetup.no_show` | record a displayed no-show claim against targetDid (reportedByDid, meetup reference hash, reportStatementCid) with weight 0 in rep-1, marked contradicted when the event says so; never creates a review |
| `comms.meetup.no_show_contradicted` | mark the recorded claim with the same meetup reference hash, reportedByDid and reportStatementCid contradicted and keep checkinStatementCid, so the claim is displayed together with the contradicting check-in; weight stays 0 and no review is created |
| `federation.record.accepted` | when cid names a completion statement or receipt listed in missingFields of a quarantined window, re-run V12 and V13 and open the window if the proof now verifies |
| `federation.tombstone.applied` | withdraw the targeted review only when the tombstone author equals Review.authorDid and its signer key was active; a tombstone signed by an origin relay only drops that relay from provenance and sourceCount, and the review stays valid |
| `identity.portable_doc.published` | origin received - re-verify quarantined reviews and tickets of that DID whose signer key was unknown; for each newly revoked key, reviews and tickets first seen at or after its clamped revokesEffectiveAt are quarantined with signer_revoked and earlier ones stay valid with a revoked-signer marker |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already pseudonymized reviews and windows kept as evidence and deleted the rest |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_REVIEW_SIGNATURE_INVALID | 422 | no | review or review ticket signature does not verify with a device key active in the signer's document |
| IDENTITY_REVIEW_PROOF_INCOMPLETE | 422 | no | the proof lacks the subject's ticket for this author and pair |
| IDENTITY_REVIEW_NOT_ELIGIBLE | 422 | no | author and subject are not an eligible pair of the context |
| IDENTITY_REVIEW_DUPLICATE | 409 | no | a review already exists for this author and pair reference |
| IDENTITY_REVIEW_WINDOW_CLOSED | 410 | no | the 30 day review window has closed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2), all signed and stored through the F11.S01.M01 StatementPublisherPort (envelope per F11.S01.M03, author the principal did:key, ext.signerKey the device key): classrup.identity.review/v1 - a device key of authorDid active in the author's document; classrup.identity.review_ticket/v1 { contextType, pairRef, issuer (the subject), holder (the author), phase: opening|completion, claimedAt } - a device key of the issuing party, audience participants, sent end-to-end encrypted to the holder only; classrup.federation.tombstone/v1 (CTR-FED-001 FED-4) - a device key of authorDid. Tickets are signed automatically by the opening handlers for every eligible counterparty; honest limit - a modified client can withhold its ticket, in which case the counterparty can post only a subject_only review backed by the subject's signed opening statement, until the producers make the counterparty ticket part of their opening statements (requested from F09.S01.M01, F02.S03.M01, F03.S02.M01 and F05.S01.M01). Producers F02.S03.M04, F03.S02.M02 and F05.S02.M02 are not listed in depends_on because they already depend on this module through F02 and F08; their events are consumed and checked against their published fixtures. Completion proofs are read by cid and author from the vault record store of F11.S01.M02 (federation.record.get and list_by_author) - deal_completion/v1 (F09.S01.M01), booking_completion/v1 (F03.S02.M02), rental_completion/v1, return_report/v1 and return_attestation/v1 (F05.S02.M02) and handover_attestation/v1 (F02.S03.M04) - and verified with key status at receiver time. A received review or ticket from a blocked DID is dropped silently (N7, F07.S02.M02 filterBlocked).

### Example

```
event commerce.deal.opened (local, parties A and B) -> pending ReviewWindow; A signs a ticket for B and B signs one for A (end-to-end encrypted)
event commerce.deal.completed (local, with contextId, completionCid, parties) -> ReviewWindow { contextType: "deal", outcome: "completed", closesAt: "2026-12-04T10:00:00.000Z" }
vault command: identity.review.post { "contextType": "deal", "contextId": "0192f450-…", "subjectDid": "did:key:z6Mk…", "rating": 5, "tags": ["on_time", "as_described"], "comment": "Smooth handover.", "audience": "public" }
-> { "reviewId": "0192f451-…", "cid": "sha256-Qm…", "pairRef": "Hk3…", "syncState": "local_committed", "skippedRelays": [] }
weight(review) = w_age * w_exp * w_repeat * w_recip * w_island * w_outcome, each in 0.1..1.0 except w_island in 0.25..1.0 and w_outcome 1.0 completed, 0.75 disputed, 0.5 cancelled; bayesianAvg = (5 * 4.0 + sum(w * rating)) / (5 + sum(w)) over the selected reviews
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T01 | integration | PS-058-01.R02, PS-058-04.R02 | opening events then completion events for a deal, a cycle, a booking and a rental | pending windows with tickets exchanged for eligible pairs, then open windows with the documented pairs and closesAt = opensAt plus 30 days |
| TEST-PS-058-09.T08 | contract | PS-058-04.R01, PS-058-04.R03 | commands, queries and events run | outputs, statements, tickets and payloads validate against registry schemas; tombstone verifies; events in the same transaction |
| TEST-PS-058-09.T21 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed without completionCid, mutiny.cycle.completed without legs, later corrected events | windows quarantined with missingFields and no pairs; after the corrected events they open |
| TEST-PS-058-09.T22 | integration | PS-058-04.R02 | commerce.dispute.resolved with resolution lapsed for a completed deal, carrying caseCid and parties | outcome becomes disputed, disputeFlag set and shown; a subject_only review names the dispute caseCid |
| TEST-PS-058-09.T23 | integration | PS-058-04.R04 | comms.meetup.no_show about Q delivered twice, then comms.meetup.no_show_contradicted for it, and a second no_show arriving with contradicted true | one claim recorded per report, noShowClaims 2, contradictedNoShowClaims 2, bayesianAvg unchanged; each claim is shown with the reporter and the contradicting check-in statement |
| TEST-PS-058-09.T26 | contract | PS-058-04.R02 | outcome and opening event fixtures of F09.S01.M01, F02.S03.M04, F03.S02.M02, F05.S02.M02 and F09.S02.M02 | each fixture parses and opens the documented window; a fixture missing an N3 field quarantines |
| TEST-PS-058-09.T28 | integration | PS-058-04.R02, PS-058-02.R04 | rentals.rental.closed with reason completed and completionKind rental_completion, with reason deposit_unsettled and completionKind return_attestation, with oneSided true, with reason not_returned, and with only the owner's rental_completion stored | windows open with outcome completed for the first two after both statements verify; no window for one-sided or not_returned closures; the last quarantined until federation.record.accepted delivers the renter's statement, then opens |
| TEST-PS-058-09.T29 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed with deal_completion statements by both parties, services.booking.completed with only the provider's booking_completion stored, and a completion event whose completionCid matches no stored statement | the deal window opens; the booking window is quarantined listing the client's statement and opens when it arrives; the unmatched one stays quarantined and no 'confirmed by both' label is shown |
| TEST-PS-058-09.T30 | integration | PS-058-04.R02, PS-058-01.R02 | mutiny.cycle.completed with receiptCids for all legs; mutiny.recovery.resolved with outcome unresolved, with dispute_outcome and with agreed for another cycle | the completed cycle opens leg-connected windows with the receipts as proof; unresolved and dispute_outcome give outcome disputed with disputeFlag and the evidenceCids recorded; agreed gives outcome cancelled; non-adjacent pairs get no window |
| TEST-PS-058-09.T31 | contract | PS-058-04.R01 | post, ticket signing and withdraw with a StatementPublisherPort spy | reviews and tickets go through StatementPublisherPort.publish and withdrawals through issueTombstone; cid and signatures follow F11.S01.M03; no other signing path |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
