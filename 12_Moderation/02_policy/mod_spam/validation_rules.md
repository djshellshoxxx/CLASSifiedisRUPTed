# PS-097-02 — Validation rules: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-02.R01** Inputs are validated for size and encoding before evaluation, and oversized input is rejected rather than truncated.
- **PS-097-02.R02** Thresholds are configuration with hard minimum and maximum values so an operator cannot disable all heuristics.
- **PS-097-02.R03** Evaluation never throws on hostile text and always returns a bounded result.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | text is valid UTF-8 and at most 20000 code points after NFKC normalization | PAYLOAD_TOO_LARGE |
| V02 | thresholds are within allowed ranges (duplicate window 1..30 days, link density 0.05..0.50, velocity 3..100 per 10 minutes) | VALIDATION_FAILED |
| V03 | caller supplies a key hash (not a raw key) and a receipt time from the store clock | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T01 | unit | PS-097-01.R03, PS-097-02.R01, PS-097-02.R02 | oversized text; out-of-range thresholds | PAYLOAD_TOO_LARGE; VALIDATION_FAILED; operator cannot set all heuristics off |
| TEST-PS-097-09.T04 | unit | PS-097-02.R03, PS-097-04.R02 | link density on zero-length and unspaced scripts; score 49 and 50 | no division by zero; event only at score ≥ 50 |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
