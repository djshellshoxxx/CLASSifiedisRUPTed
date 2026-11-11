# PS-095-02 — Validation rules: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-02.R01** Rule input is validated strictly, including ID format, text sizes and allowed action vocabulary.
- **PS-095-02.R02** Publication checks the notice period for restrictive changes only, the changelog and that the rule is the next version, and initial adoption on a new relay takes effect at its stated effective date.
- **PS-095-02.R03** Every violation maps to one stable error code.
- **PS-095-02.R04** A change is classified initial, restrictive or non_restrictive by testable rules, and a declared class that the rules contradict is refused.
- **PS-095-02.R05** A governance decision becomes a draft only when it is relay-scope, approved, about platform_policy, published by this relay's operator and its content digest matches, and every draft built from it passes the same rule checks as an operator draft.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleId matches POL-[A-Z]+-[0-9]{3}, family is in the enum and no unknown fields are present | VALIDATION_FAILED |
| V02 | title ≤ 120, summary ≤ 400, body ≤ 4000 code points in at least one locale | VALIDATION_FAILED |
| V03 | allowedActions is a non-empty subset of the four relay action kinds | VALIDATION_FAILED |
| V04 | changeType restrictive requires effectiveAt ≥ publication + 14 days unless severity is imminent_harm | MODERATION_POLICY_NOTICE_TOO_SHORT |
| V05 | version equals current published version + 1 and expectedRevision matches | CONFLICT_REVISION |
| V06 | family prohibited_goods requires prohibitedRuleRef { publisherId, ruleKey, ruleId? } whose (publisherId, ruleKey) has an active version in the relay's applied F18.S01.M02 pack (governance.prohibited_rule.get), and ruleId, when present, names a version of that key | VALIDATION_FAILED |
| V07 | a retired ruleId cannot be republished with the same ID | MODERATION_POLICY_RETIRED |
| V08 | changeType non_restrictive requires a previous version with the same family whose allowedActions include the new ones and whose severity is not lower; version 1 of a rule on a relay that already has an in-force policy is restrictive | VALIDATION_FAILED |
| V09 | changeType initial only while the relay has no in-force policy version yet, with effectiveAt stated and not before publication | VALIDATION_FAILED |
| V10 | check_citable input names ruleId, version and a decision time not in the future | VALIDATION_FAILED |
| V11 | a governance.policy_proposal.decided event is drafted only with scope relay, targetType platform_policy, outcome approved, publisherId an operator key of this relay, changeDigest equal to sha256-JCS(proposedChange) (or of the stored proposal statement's proposedChange when only proposedChangeCid is carried), every targetRef matching POL-[A-Z]+-[0-9]{3} and every proposedChange entry passing V01–V03, V06, V08 and V09 | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T01 | unit | PS-095-01.R01, PS-095-01.R03, PS-095-02.R01 | draft and publish a valid rule; draft with an unknown field | version row stored with changeType, version = previous + 1, ID matches pattern; VALIDATION_FAILED |
| TEST-PS-095-09.T02 | unit | PS-095-02.R02, PS-095-02.R03 | each rule V02–V10 violated | documented error code and nothing stored |
| TEST-PS-095-09.T15 | integration | PS-095-02.R04, PS-095-02.R02 | fresh relay Z adopts the seed set as initial with effectiveAt = publication; relay X publishes a restrictive v2 with 3 days notice, a non_restrictive text fix with immediate effect, a new rule version 1 labelled non_restrictive, and an initial version | Z's rules in force at once; NOTICE_TOO_SHORT; text fix in force at once; VALIDATION_FAILED; VALIDATION_FAILED |
| TEST-PS-095-09.T17 | integration | PS-095-04.R05, PS-095-02.R05, PS-095-03.R05 | relay-scope decided events for platform_policy: approved with proposedChange for POL-FRAUD-001 and new POL-SCAM-001 delivered twice, a vault-scope copy, a prohibited_rule target, a digest mismatch, a publisher that is not an operator key of the relay, then conflicted for the approved proposal | one draft per (decisionCid, ruleId) with governanceRef built without a get call; the copy, the other target, the mismatch and the foreign publisher create nothing; conflicted discards the unpublished drafts with reason governance_conflicted; nothing is published |
| TEST-PS-095-09.T18 | integration | PS-095-04.R06, PS-095-01.R05, PS-095-02.R02 | draft with prohibitedRuleRef { publisherId P, ruleKey counterfeit_goods }, with an unknown ruleKey and with a ruleId of another key; relay-scope prohibited_rule.changed retired for (P, counterfeit_goods) and a vault-scope copy; check_citable for the dependent version | stored; VALIDATION_FAILED twice; prohibitedRefStatus retired and flag set in the review table while the version row is unchanged; copy ignored; citable false |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
