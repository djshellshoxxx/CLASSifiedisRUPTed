# PS-097-01 — Domain schema: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-01.R01** The module owns no persistent entities; all inputs are signed projections or local records and results are events carrying the evidence values.
- **PS-097-01.R02** The derived fingerprint index stores only hashes and counters, never text, and expires entries after 30 days.
- **PS-097-01.R03** Every result records the heuristic set version and thresholds used so decisions can be reproduced.

## Specification

**Note:** Owns no catalog entities. A derived fingerprint index (tenant, actor key hash, normalized sha256, simhash64, observedAt) is kept per store for 30 days (RET-SHORT), is rebuilt from the index or vault, and is never exported.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T01 | unit | PS-097-01.R03, PS-097-02.R01, PS-097-02.R02 | oversized text; out-of-range thresholds | PAYLOAD_TOO_LARGE; VALIDATION_FAILED; operator cannot set all heuristics off |
| TEST-PS-097-09.T02 | unit | PS-097-01.R02, PS-097-03.R01 | duplicate window and simhash distance 3 and 4 | distance 3 flagged duplicate_near, distance 4 not |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-03.R02 | random texts evaluated twice with the same index snapshot | identical output; no exceptions; bounded runtime |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
