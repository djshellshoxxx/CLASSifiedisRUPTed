# PS-058-02 — Validation rules: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-02.R01** Reviews are validated for schema, signature, eligibility and proof before they count; failures are quarantined with a reason, not silently dropped.
- **PS-058-02.R02** Eligibility derives only from completion evidence and the pair list, never from the review text.
- **PS-058-02.R03** Limits on volume and size bound the work a hostile sender can cause.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | rating is an integer 1..5, tags at most 3 from the fixed list, comment at most 500 code points of plain text | VALIDATION_FAILED |
| V02 | review signature verifies against authorDid over JCS bytes | IDENTITY_REVIEW_SIGNATURE_INVALID |
| V03 | proof carries valid signatures of both authorDid and subjectDid over the completion cid | IDENTITY_REVIEW_PROOF_INCOMPLETE |
| V04 | authorDid and subjectDid form an eligible pair of the completion (all pairs for two-party contexts, leg-connected pairs for cycles) | IDENTITY_REVIEW_NOT_ELIGIBLE |
| V05 | no review exists yet for (contextType, contextId, authorDid, subjectDid) | IDENTITY_REVIEW_DUPLICATE |
| V06 | claimedPostedAt is within 30 days plus 2 days of skew after proof.completionClaimedAt, and for own posts the local window is open | IDENTITY_REVIEW_WINDOW_CLOSED |
| V07 | the author has posted fewer than 30 reviews in the last 24 hours and the vault accepts fewer than 200 received reviews per hour from one source | RATE_LIMITED |
| V08 | authorDid differs from subjectDid | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T02 | unit | PS-058-01.R01, PS-058-02.R01, PS-058-02.R02 | post a valid review | statement signed, stored posted, immutable fields unchanged, cid computed |
| TEST-PS-058-09.T03 | unit | PS-058-02.R02, PS-058-02.R03 | bad signature, proof with one signature, non-adjacent cycle pair, duplicate, 40 days late, rating 6 | the documented error or quarantine reason each time |
| TEST-PS-058-09.T07 | abuse | PS-058-07.R03, PS-058-02.R03 | collusion pair posts 6 reviews on fabricated completions | repeat and reciprocity weights reduce them; all but the first per context refused as duplicates |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
