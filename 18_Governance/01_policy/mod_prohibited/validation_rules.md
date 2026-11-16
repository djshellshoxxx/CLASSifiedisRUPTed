# PS-146-02 — Validation rules: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-02.R01** Rule content is validated for size, normalization, scope and action before staging or applying.
- **PS-146-02.R02** Evaluation input is bounded and validated before matching so evaluation time stays predictable.
- **PS-146-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleKey matches [a-z0-9_]{3,40}; reasonKey present | VALIDATION_FAILED |
| V02 | rule has at least one categoryId or one keyword; keywords <= 50 of 2..60 code points after normalization | VALIDATION_FAILED |
| V03 | categoryIds exist in the active taxonomy (retired ids resolve via mergedInto) | GOVERNANCE_RULE_SCOPE_INVALID |
| V04 | action is block, review or allow_with_notice; notices required for review and allow_with_notice | VALIDATION_FAILED |
| V05 | activation cites a verified approved proposal unless the rule is an emergency review rule | GOVERNANCE_RULE_PROPOSAL_REQUIRED |
| V06 | emergency rule has action review and emergencyUntil <= activation + 7 days | GOVERNANCE_RULE_EMERGENCY_INVALID |
| V07 | pack has <= 2000 active rules and <= 1 MiB; signature verifies and publisher trusted | GOVERNANCE_RULE_PACK_REJECTED |
| V08 | evaluation input title + description + tags <= 8000 code points | VALIDATION_FAILED |
| V09 | pack version greater than the applied version and a full snapshot | GOVERNANCE_RULE_PACK_REJECTED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01, PS-146-02.R02 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T02 | unit | PS-146-02.R03 | violate each rule V01-V09 | documented error code returned; nothing released or applied |
| TEST-PS-146-09.T03 | property | PS-146-01.R03, PS-146-02.R02 | random texts with look-alikes and zero-width characters | verdict deterministic and stable under normalization; whole-word mode avoids substring matches |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
