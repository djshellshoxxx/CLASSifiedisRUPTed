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
| V02 | thresholds are within allowed ranges (duplicate window 1..30 days, link density 0.05..0.50, velocity 3..100 per 10 minutes, new-key window 1..14 days) | VALIDATION_FAILED |
| V03 | the caller supplies mode, the subject did:key and the store's receipt time; a claimed createdAt is optional and only feeds backdated_claim | VALIDATION_FAILED |
| V04 | mode author_presign is accepted only in the local principal's vault for the principal's own key, and relay_intake only from the relay index-intake hook | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T01 | unit | PS-097-02.R01, PS-097-02.R02 | oversized text; out-of-range thresholds; operator config that would disable every heuristic | PAYLOAD_TOO_LARGE without truncation; VALIDATION_FAILED; values clamped to minimums so heuristics stay active |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-01.R03, PS-097-02.R03, PS-097-03.R01, PS-097-06.R01 | random and hostile texts evaluated twice with the same index snapshot | identical output including rulesVersion and thresholds; no exceptions; score within 0..100; bounded runtime |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
