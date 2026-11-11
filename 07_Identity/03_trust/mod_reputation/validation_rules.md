# PS-058-02 — Validation rules: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-02.R01** Reviews are validated for schema, signature, eligibility and proof before they count; failures are quarantined with a reason, not silently dropped.
- **PS-058-02.R02** Eligibility derives only from bilateral opening evidence - the subject's signed review ticket for the pair - and the pair list, never from the review text or the subject's later cooperation.
- **PS-058-02.R03** Limits on volume and size bound the work a hostile sender can cause.
- **PS-058-02.R04** Signer keys of reviews, tickets and tombstones must be active in the signer's portable document at this vault's first-seen time, and outcome events must carry the N3 fields or the window is quarantined.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | rating is an integer 1..5, tags at most 3 from the fixed list, comment at most 500 code points of plain text | VALIDATION_FAILED |
| V02 | review signature verifies over JCS bytes with prefix classrup-review:v1 using a device key that the author's document listed as active at this vault's first-seen time (F07.S02.M01 key_status) | IDENTITY_REVIEW_SIGNATURE_INVALID |
| V03 | proof carries a classrup.identity.review_ticket/v1 signed by subjectDid with an active device key over classrup-review-ticket:v1:<contextType>:<pairRef>:<subjectDid>:<authorDid>, naming authorDid as holder; a subject_only review may instead carry the subject's signed opening statement | IDENTITY_REVIEW_PROOF_INCOMPLETE |
| V04 | authorDid and subjectDid form an eligible pair - for own posts the pair is in the author's open window (all pairs for two-party contexts, leg-connected pairs for cycles); for received reviews the subject's ticket names this pair and pairRef | IDENTITY_REVIEW_NOT_ELIGIBLE |
| V05 | no review exists yet for (authorDid, pairRef) | IDENTITY_REVIEW_DUPLICATE |
| V06 | claimedPostedAt is within 30 days plus 2 days of skew after the ticket's claimed outcome time, and for own posts the local window is open | IDENTITY_REVIEW_WINDOW_CLOSED |
| V07 | the author has posted fewer than 30 reviews in the last 24 hours and the vault accepts fewer than 200 received reviews per hour from one source | RATE_LIMITED |
| V08 | authorDid differs from subjectDid | VALIDATION_FAILED |
| V09 | a public review contains no contextId, completionCid, disputeCaseCid or openingEvidence; those appear only in subject_only reviews | VALIDATION_FAILED |
| V10 | outcome disputed sets disputeFlag and, in own and subject_only records, names the dispute case cid; outcome completed is shown as 'confirmed by both' only with a subject-signed completion ticket | VALIDATION_FAILED |
| V11 | a public review is queued to a relay only after privacy.consent.check(federation_publish, relayId) is granted; tombstones are always sent | PRECONDITION_FAILED |
| V12 | an outcome event carries contextId, completionCid (or caseCid for disputes), parties with roles, and legs for cycles; otherwise the window is quarantined with missingFields | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01 | post a valid review | statement signed by an active device key, stored posted, immutable fields unchanged, outcome label set, cid computed |
| TEST-PS-058-09.T03 | unit | PS-058-02.R01, PS-058-02.R02 | bad signature, missing ticket, ticket naming another holder, non-adjacent cycle pair, duplicate for the pair, 40 days late, rating 6 | the documented error or quarantine reason each time |
| TEST-PS-058-09.T07 | abuse | PS-058-09.R03, PS-058-02.R02 | collusion pair posts 6 reviews on fabricated contexts with tickets from their own keys | repeat and reciprocity weights reduce them; a second review for the same pairRef is refused as a duplicate |
| TEST-PS-058-09.T11 | abuse | PS-058-02.R03, PS-058-05.R02, PS-058-07.R01 | 31 reviews in 24 hours by one author; 201 received per hour from one source; a subject_only review read without the subject key; a comment containing a phone number | RATE_LIMITED for the 31st and excess quarantined; the subject_only review is unreadable; the composer warns about the contact data before signing |
| TEST-PS-058-09.T19 | abuse | PS-058-09.R04, PS-058-02.R02 | the subject withholds its completion ticket and the deal is cancelled | the author still posts with the opening ticket, outcome cancelled shown as a label, weight factor 0.5; without the opening ticket only subject_only is offered |
| TEST-PS-058-09.T21 | integration | PS-058-04.R02, PS-058-02.R04 | commerce.deal.completed without completionCid, mutiny.cycle.completed without legs, later corrected events | windows quarantined with missingFields and no pairs; after the corrected events they open |
| TEST-PS-058-09.T24 | unit | PS-058-02.R04 | a review signed by a device key revoked before this vault first saw it, and one first seen before the revocation | the first quarantined with signer_revoked; the second stays posted |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
