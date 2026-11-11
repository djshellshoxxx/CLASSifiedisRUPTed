# PS-147-02 — Validation rules: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-02.R01** Proposals are validated for length, target references, comment period and signer roles before publication.
- **PS-147-02.R02** Comments and decisions are validated against the proposal state and signer keys on the relay and again in every receiving vault.
- **PS-147-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | title 3..120, summary 10..2000, changelogEntry 10..1000 code points, plain text | VALIDATION_FAILED |
| V02 | targetRefs 1..20 and proposedChange <= 16 KiB JCS and matches targetType schema | VALIDATION_FAILED |
| V03 | commentPeriodHours 72..720, or 24..71 only with expedited true, expeditedReason and distinct coSignerId | GOVERNANCE_PROPOSAL_PERIOD_INVALID |
| V04 | decider key differs from the proposer key and is in the publisher's authority list | GOVERNANCE_PROPOSAL_SELF_DECISION |
| V05 | decision only when status is decision_pending (comment period ended) | CONFLICT_STATE |
| V06 | comment body 1..2000 code points; author has fewer than 5 visible comments on the proposal | GOVERNANCE_COMMENT_LIMIT |
| V07 | comment arrives while proposal is open_for_comment per the relay clock | EXPIRED |
| V08 | every statement signature verifies and author matches the stated role | VALIDATION_FAILED |
| V09 | publisher has fewer than 20 proposals in draft, open_for_comment or decision_pending | GOVERNANCE_PROPOSAL_LIMIT |
| V10 | verify target refs equal the approved decision's targetRefs and validUntil has not passed | GOVERNANCE_PROPOSAL_NOT_VALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T01 | unit | PS-147-01.R01, PS-147-02.R01, PS-147-02.R02 | draft a proposal with valid and invalid fields | stored with revision 1; invalid length or target gives documented error |
| TEST-PS-147-09.T02 | unit | PS-147-01.R02, PS-147-01.R03, PS-147-02.R03 | violate each rule V01-V10 | documented error code returned; no statement produced or accepted |
| TEST-PS-147-09.T04 | integration | PS-147-03.R02, PS-147-02.R03 | comment accepted by relay clock after publisher clock ended | relay clock decides acceptance; UI labels times as claims |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03 | verify with exact targets, other targets, after 31 days | valid true only for exact targets within 30 days |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
