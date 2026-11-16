# PS-020-01 — Domain schema: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-01.R01** The length-3 profile is a typed, versioned constant with the numeric defaults stated in the responsibilities and is registered with the engine at startup.
- **PS-020-01.R02** Overrides are accepted only within the stated bounds and the effective values and profile version are copied into every suggestion's explanation so later changes never rewrite history.
- **PS-020-01.R03** The explanation model is derived from the CycleSuggestion legs and local ports and stores nothing of its own.

## Specification

**Note:** Library module. The length-3 profile is a typed constant LengthProfile {length: 3, toleranceBps: 500, absoluteMinMajor: 5, maxPairBucket: 3 (25-50 km), imbalanceQuantumPermille: 10, minWantAgeMinutes: 15, version: 'p3.1'} registered with F02.S02.M03; overrides are tenant settings, not records owned here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01 | read default profile | toleranceBps 500, absoluteMinMajor 5, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.1 |
| TEST-PS-020-09.T02 | unit | PS-020-01.R02, PS-020-02.R01 | override 1001 bps, 1000 bps, absolute minimum 101 and 100 | 1001 and 101 rejected, 1000 and 100 accepted and recorded |
| TEST-PS-020-09.T03 | unit | PS-020-01.R03, PS-020-02.R03, PS-020-09.R02 | golden 3-party explanation | gaps 500, 200, 300 with tolerances 600, 600, 590 exactly as in the example |
| TEST-PS-020-09.T13 | a11y | PS-020-01.R01 | explanation panel | axe zero serious issues; sentence per participant readable |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
