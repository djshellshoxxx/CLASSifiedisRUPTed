# PS-147-02 — Validation rules: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-02.R01** Proposals are validated for length, target references, comment period and signer roles before publication.
- **PS-147-02.R02** Comments and decisions are validated against the proposal state and signer keys on the relay and again in every receiving vault.
- **PS-147-02.R03** Every violation maps to one stable error code.
- **PS-147-02.R04** Receivers enforce the comment period from relay receipts, never from publisher or decider timestamps, and verify that the activated content equals the approved content.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | title 3..120, summary 10..2000, changelogEntry 10..1000 code points, plain text | VALIDATION_FAILED |
| V02 | targetRefs 1..20, proposedChange <= 16 KiB JCS, keyed only by targetRefs and matching the targetType change schema, changeDigest = sha256-JCS(proposedChange) | VALIDATION_FAILED |
| V03 | commentPeriodHours 72..720, or 24..71 only with expedited true, expeditedReason, one coSignerId distinct from publisherId and a verified policy_cosign statement over the proposal cid | GOVERNANCE_PROPOSAL_PERIOD_INVALID |
| V04 | decider key differs from the proposer key and from publisherId, appears with role decider in the publisher's latest verified authority list anchored no later than decidedAt, and was first listed at least 14 days before the proposal's relay receipt | GOVERNANCE_PROPOSAL_SELF_DECISION |
| V05 | decide only when the decider vault's verified proposal mirror is decision_pending (anchored comment end passed) and the decision binds that proposal's statement cid | CONFLICT_STATE |
| V06 | comment body 1..2000 code points; author has fewer than 5 visible comments on the proposal | GOVERNANCE_COMMENT_LIMIT |
| V07 | comment relay receipt time is before proposal relay receipt + commentPeriodHours on the anchoring relay | EXPIRED |
| V08 | every statement signature verifies and the author matches the registered signer role (publisher principal, delegated decider or co-signer, comment author) | VALIDATION_FAILED |
| V09 | publisher has fewer than 20 proposals in draft, open_for_comment or decision_pending | GOVERNANCE_PROPOSAL_LIMIT |
| V10 | verify: targetRefs are a subset of the decision's targetRefs, decision publisherId equals the caller's artifact publisherId, changeDigest equals sha256-JCS of proposedChange restricted to those targetRefs, decision anchor <= asOf <= validUntil, and the decision is not in priorDecisionCids | GOVERNANCE_PROPOSAL_NOT_VALID |
| V11 | receiver period check: openedAt >= proposal relay receipt time - 10 min, and the decision's relay receipt from the same relay is at least proposal receipt + commentPeriodHours; a decision without a verifiable receipt cannot prove the period and verify returns period_not_elapsed | GOVERNANCE_PROPOSAL_NOT_VALID |
| V12 | authority list version greater than the stored version, 1..10 distinct entries with role decider or cosigner, no entry equal to publisherId, signed by the publisher principal | GOVERNANCE_AUTHORITY_LIST_INVALID |
| V13 | policy_cosign signed by coSignerId over the exact proposal cid, coSignerId listed with role cosigner or decider and different from publisherId and from the later deciderId | GOVERNANCE_PROPOSAL_PERIOD_INVALID |
| V14 | trusted_publisher.add only from the owner's trust dialog: fingerprintConfirmed equals the computed fingerprint, scopes non-empty, and at most 10 user-added publishers; sync ingestion and internal callers are refused | GOVERNANCE_TRUST_LIMIT |
| V15 | comment relay intake through RateLimitPort (F12.S03.M03): 10 per hour per key, 30 per 24 h per /24 (IPv4) or /48 (IPv6) prefix; keys registered on the relay less than 7 days ago at most 1 comment each and 25 per proposal (F12.S03.M04 limits check, N18) | RATE_LIMITED |
| V16 | a comment withdrawal is a classrup.federation.tombstone/v1 signed by the comment's author principal for the comment cid | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T01 | unit | PS-147-01.R01, PS-147-02.R01, PS-147-02.R02 | draft a proposal with valid and invalid fields | stored with revision 1 and changeDigest; invalid length, target or change keys give documented error |
| TEST-PS-147-09.T02 | unit | PS-147-01.R02, PS-147-01.R03, PS-147-02.R03 | violate each rule V01-V16 | documented error code returned; no statement produced or accepted |
| TEST-PS-147-09.T04 | integration | PS-147-03.R02, PS-147-02.R03, PS-147-02.R04 | comment accepted by relay clock after the publisher clock ended; publisher clock skewed by 2 days | relay receipt decides acceptance and commentEndsAt = proposal receipt + period; UI labels other times as claims |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03, PS-147-02.R04 | verify with the exact targets, a subset, another target, publisher B citing publisher A's decision, a changed digest, asOf 31 days after the decision anchor, a prior decision cid | valid only for subset with matching publisher and digest inside the window; reasons target_mismatch, publisher_mismatch, content_mismatch, expired and already_used |
| TEST-PS-147-09.T18 | abuse | PS-147-02.R04, PS-147-04.R03, PS-147-03.R02 | proposal with openedAt backdated by 3 days; decision received 1 h after the proposal receipt; decision without a receipt | openedAt rejected (below receipt - 10 min); verify returns period_not_elapsed for both decisions |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
