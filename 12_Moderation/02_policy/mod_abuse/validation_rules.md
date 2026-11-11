# PS-095-02 — Validation rules: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-02.R01** Rule input is validated strictly, including ID format, text sizes and allowed action vocabulary.
- **PS-095-02.R02** Publication checks the notice period for restrictive changes only, the changelog and that the rule is the next version, and initial adoption on a new relay takes effect at its stated effective date.
- **PS-095-02.R03** Every violation maps to one stable error code.
- **PS-095-02.R04** A change is classified initial, restrictive or non_restrictive by testable rules, and a declared class that the rules contradict is refused.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleId matches POL-[A-Z]+-[0-9]{3}, family is in the enum and no unknown fields are present | VALIDATION_FAILED |
| V02 | title ≤ 120, summary ≤ 400, body ≤ 4000 code points in at least one locale | VALIDATION_FAILED |
| V03 | allowedActions is a non-empty subset of the four relay action kinds | VALIDATION_FAILED |
| V04 | changeType restrictive requires effectiveAt ≥ publication + 14 days unless severity is imminent_harm | MODERATION_POLICY_NOTICE_TOO_SHORT |
| V05 | version equals current published version + 1 and expectedRevision matches | CONFLICT_REVISION |
| V06 | family prohibited_goods requires prohibitedRuleRef that exists and is active in F18.S01.M02 | VALIDATION_FAILED |
| V07 | a retired ruleId cannot be republished with the same ID | MODERATION_POLICY_RETIRED |
| V08 | changeType non_restrictive requires a previous version with the same family whose allowedActions include the new ones and whose severity is not lower; version 1 of a rule on a relay that already has an in-force policy is restrictive | VALIDATION_FAILED |
| V09 | changeType initial only while the relay has no in-force policy version yet, with effectiveAt stated and not before publication | VALIDATION_FAILED |
| V10 | check_citable input names ruleId, version and a decision time not in the future | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T01 | unit | PS-095-01.R01, PS-095-01.R03, PS-095-02.R01 | draft and publish a valid rule; draft with an unknown field | version row stored with changeType, version = previous + 1, ID matches pattern; VALIDATION_FAILED |
| TEST-PS-095-09.T02 | unit | PS-095-02.R02, PS-095-02.R03 | each rule V02–V10 violated | documented error code and nothing stored |
| TEST-PS-095-09.T15 | integration | PS-095-02.R04, PS-095-02.R02 | fresh relay Z adopts the seed set as initial with effectiveAt = publication; relay X publishes a restrictive v2 with 3 days notice, a non_restrictive text fix with immediate effect, a new rule version 1 labelled non_restrictive, and an initial version | Z's rules in force at once; NOTICE_TOO_SHORT; text fix in force at once; VALIDATION_FAILED; VALIDATION_FAILED |

## Dependencies

Module depends on: F18.S01.M02, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
