# PS-058-02 — Validation rules: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-02.R01** Reviews are validated for schema, signature, eligibility and proof before they count; failures are quarantined with a reason, not silently dropped.
- **PS-058-02.R02** Eligibility derives only from bilateral opening evidence - the subject's signed review ticket for the pair - and the pair list, never from the review text or the subject's later cooperation.
- **PS-058-02.R03** Limits on volume and size bound the work a hostile sender can cause.
- **PS-058-02.R04** Signer keys of reviews, tickets and tombstones must not be revoked in the signer's latest verified portable document at receipt (F07.S02.M01 key_status at receiver time), a revocation learned later quarantines those first seen at or after its clamped revokesEffectiveAt, and outcome events must carry the N3 fields and verifiable completion statements or the window is quarantined.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | rating is an integer 1..5, tags at most 3 from the fixed list, comment at most 500 code points of plain text | VALIDATION_FAILED |
| V02 | the review envelope signature verifies per F11.S01.M03 with ext.signerKey a device key that the author's latest verified document does not mark revoked at receipt, whatever createdAt claims (F07.S02.M01 key_status at receiver time) | IDENTITY_REVIEW_SIGNATURE_INVALID |
| V03 | proof carries a classrup.identity.review_ticket/v1 envelope authored by subjectDid and signed with a device key not revoked at receipt, whose payload { contextType, pairRef, issuer: subjectDid, holder: authorDid, phase, claimedAt } names authorDid as holder; a subject_only review may instead carry the subject's signed opening statement | IDENTITY_REVIEW_PROOF_INCOMPLETE |
| V04 | authorDid and subjectDid form an eligible pair - for own posts the pair is in the author's open window (all pairs for two-party contexts, leg-connected pairs for cycles); for received reviews the subject's ticket names this pair and pairRef | IDENTITY_REVIEW_NOT_ELIGIBLE |
| V05 | no review exists yet for (authorDid, pairRef) | IDENTITY_REVIEW_DUPLICATE |
| V06 | claimedPostedAt is within 30 days plus 2 days of skew after the ticket's claimed outcome time, and for own posts the local window is open | IDENTITY_REVIEW_WINDOW_CLOSED |
| V07 | the author has posted fewer than 30 reviews in the last 24 hours and the vault accepts fewer than 200 received reviews per hour from one source | RATE_LIMITED |
| V08 | authorDid differs from subjectDid | VALIDATION_FAILED |
| V09 | a public review contains no contextId, completionCid, disputeCaseCid or openingEvidence; those appear only in subject_only reviews | VALIDATION_FAILED |
| V10 | outcome disputed sets disputeFlag and, in own and subject_only records, names the dispute case cid or, for a cycle recovery, the reviewUnlock evidence cids; outcome completed is shown as 'confirmed by both' only with a subject-signed completion ticket | VALIDATION_FAILED |
| V11 | a public review is queued to a relay only after privacy.consent.check(federation_publish, relayId) is granted; tombstones are always sent | PRECONDITION_FAILED |
| V12 | an outcome event carries contextId, completionCid (caseCid for disputes, reviewUnlock.evidenceCids for cycle recoveries), parties with roles, and legs for cycles; rentals.rental.closed also has reason completed or deposit_unsettled, completionKind and oneSided false; otherwise the window is quarantined with missingFields, and a one-sided rental closure opens no window | VALIDATION_FAILED |
| V13 | the completion statements behind completionCid verify in this vault's record store (F11.S01.M02) - deal: a classrup.commerce.deal_completion/v1 by every party; booking: classrup.services.booking_completion/v1 by the client and by the provider; rental completionKind rental_completion: classrup.rentals.rental_completion/v1 by the owner and by the renter; completionKind return_attestation: completionCid is the renter's classrup.rentals.return_report/v1 and the owner's classrup.rentals.return_attestation/v1 is over it; cycle: each receiptCid is a verified classrup.mutiny.handover_attestation/v1 of kind received for one leg; otherwise the window is quarantined with the missing statements listed | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01 | post a valid review | statement signed by an active device key, stored posted, immutable fields unchanged, outcome label set, cid computed |
| TEST-PS-058-09.T03 | unit | PS-058-02.R01, PS-058-02.R02 | bad signature, missing ticket, ticket naming another holder, non-adjacent cycle pair, duplicate for the pair, 40 days late, rating 6 | the documented error or quarantine reason each time |
| TEST-PS-058-09.T07 | abuse | PS-058-09.R03, PS-058-02.R02 | collusion pair posts 6 reviews on fabricated contexts with tickets from their own keys | repeat and reciprocity weights reduce them; a second review for the same pairRef is refused as a duplicate |
| TEST-PS-058-09.T11 | abuse | PS-058-02.R03, PS-058-05.R02, PS-058-07.R01 | 31 reviews in 24 hours by one author; 201 received per hour from one source; a subject_only review read without the subject key; a comment containing a phone number | RATE_LIMITED for the 31st and excess quarantined; the subject_only review is unreadable; the composer warns about the contact data before signing |
| TEST-PS-058-09.T19 | abuse | PS-058-09.R04, PS-058-02.R02 | the subject withholds its completion ticket and the deal is cancelled | the author still posts with the opening ticket, outcome cancelled shown as a label, weight factor 0.5; without the opening ticket only subject_only is offered |
| TEST-PS-058-09.T21 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed without completionCid, mutiny.cycle.completed without legs, later corrected events | windows quarantined with missingFields and no pairs; after the corrected events they open |
| TEST-PS-058-09.T24 | unit | PS-058-02.R04 | a review with a backdated createdAt signed by a device key the latest verified document already marks revoked; the revocation learned later for one review first seen after its clamped effective time and one first seen before it | the first quarantined with signer_revoked at receipt; on learning, the later-seen one quarantined and the earlier-seen one stays posted with a revoked-signer marker |
| TEST-PS-058-09.T28 | integration | PS-058-04.R02, PS-058-02.R04 | rentals.rental.closed with reason completed and completionKind rental_completion, with reason deposit_unsettled and completionKind return_attestation, with oneSided true, with reason not_returned, and with only the owner's rental_completion stored | windows open with outcome completed for the first two after both statements verify; no window for one-sided or not_returned closures; the last quarantined until federation.record.accepted delivers the renter's statement, then opens |
| TEST-PS-058-09.T29 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed with deal_completion statements by both parties, services.booking.completed with only the provider's booking_completion stored, and a completion event whose completionCid matches no stored statement | the deal window opens; the booking window is quarantined listing the client's statement and opens when it arrives; the unmatched one stays quarantined and no 'confirmed by both' label is shown |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
