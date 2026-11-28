# PS-146-02 — Validation rules: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-02.R01** Rule content is validated for size, normalization, scope and action before staging or applying.
- **PS-146-02.R02** Evaluation input is bounded and validated before matching so evaluation time stays predictable.
- **PS-146-02.R03** Every violation maps to one stable error code.
- **PS-146-02.R04** Receiving vaults verify decisions only for rule versions that are new or changed against their applied snapshot, at the anchored activation time of the pack version that first activated them and never at the receiver's clock, so full snapshots with long-approved rules stay applicable for new and long-offline vaults.
- **PS-146-02.R05** Emergency rules are limited per (publisherId, ruleKey) over any 30-day window, and receivers enforce the limit from their stored pack history.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleKey matches [a-z0-9_]{3,40}; reasonKey present | VALIDATION_FAILED |
| V02 | rule has at least one categoryId or one keyword; keywords <= 50 of 2..60 code points after normalization | VALIDATION_FAILED |
| V03 | categoryIds resolve in the pack's declared taxonomyRef when the vault holds it (retired ids via mergedInto); in the publisher vault they must resolve before release | GOVERNANCE_RULE_SCOPE_INVALID |
| V04 | action is block, review or allow_with_notice; notices required for review and allow_with_notice | VALIDATION_FAILED |
| V05 | every non-emergency rule version cites proposalId; for versions new or changed against the applied snapshot governance.policy_proposal.verify returns valid for (publisherId, prohibited_rule, [ruleKey], changeDigest = sha256-JCS({ruleKey: canonical rule content with keywordHashes for sensitive rules}), asOf = activatedAt of its rulesetVersion, priorDecisionCids of earlier versions); carried-forward versions keep their recorded verification | GOVERNANCE_RULE_PROPOSAL_REQUIRED |
| V06 | emergency rule has action review and emergencyUntil <= activation + 7 days; receivers retire it at min(emergencyUntil, firstSeenAt + 7 d) with firstSeenAt from the pack's relay receipt, else the receiver's first sight | GOVERNANCE_RULE_EMERGENCY_INVALID |
| V07 | pack has <= 2000 active rules and <= 1 MiB; signature verifies, the signing key is active (F07.S02.M01 key status) and the publisher is trusted for scope rules and not paused (F18.S02.M01) | GOVERNANCE_RULE_PACK_REJECTED |
| V08 | evaluation input title + description + tags <= 8000 code points | VALIDATION_FAILED |
| V09 | pack version greater than the applied version and a full snapshot | GOVERNANCE_RULE_PACK_REJECTED |
| V10 | a rule whose category scope does not resolve is stored scope_unresolved and evaluated only by the fallback (category scope matches by exact categoryId equality without subtree; keyword matches in any category with the action capped at review); releasing an unresolved scope in the publisher vault is refused | GOVERNANCE_RULE_SCOPE_INVALID |
| V11 | at most one emergency activation per (publisherId, ruleKey) in any 30 days and at most 7 cumulative emergency days per (publisherId, ruleKey) in any 30 days without a verified proposal, checked from stored pack history | GOVERNANCE_RULE_EMERGENCY_INVALID |
| V12 | sensitive rules use matchMode whole_word, phrases of 1..5 tokens, keywordHashes = sha256 of keywordSalt followed by the normalized phrase and no plaintext keywords in the pack | GOVERNANCE_RULE_PACK_REJECTED |
| V13 | the pack embeds the decision envelope and receipt for every rule version first activated in this pack version and cites older ones by decisionCid; a cited decision that cannot be fetched holds that rule at its previous version | GOVERNANCE_RULE_PROPOSAL_REQUIRED |
| V14 | pack declares taxonomyRef {publisherId, packVersion?, packCid?}, and jurisdiction scopes are ProfileRefs {publisherId, code} | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T02 | unit | PS-146-02.R03 | violate each rule V01-V14 | documented error code returned; nothing released or applied |
| TEST-PS-146-09.T12 | abuse | PS-146-02.R02 | 100 000-code-point input; 2 001 rules; 601 evaluations in a minute | rejected before matching; pack rejected; RATE_LIMITED as local resource protection |
| TEST-PS-146-09.T19 | integration | PS-146-02.R04, PS-146-01.R05 | vault offline 45 days applies pack 41; fresh vault applies pack 41 whose rules from pack 12 cite the year-old D1; PB's pack cites D2 of PK1; a rule version whose keywords differ from D2's approved content | both vaults apply pack 41 (asOf from anchors or claimed createdAt, never the vault clock); PB's rule rejected with publisher_mismatch; changed rule rejected with content_mismatch and held at its previous version |
| TEST-PS-146-09.T20 | abuse | PS-146-02.R05, PS-146-03.R03 | emergency rule re-issued under the same key each week; emergency rule with activation dated 30 days in the future | second activation within 30 days rejected with GOVERNANCE_RULE_EMERGENCY_INVALID; future-dated rule expires 7 days after first sight |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
