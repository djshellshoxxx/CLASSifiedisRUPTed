# PS-017-01 — Domain schema: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-01.R01** The length-4 profile is a typed, versioned constant with the stricter numeric values stated above and is registered with the engine at startup.
- **PS-017-01.R02** Overrides are accepted only inside bounds (tolerance 0..1000 bps, absolute minimum 0..100 major units, pair bucket 0..4) and effective values are copied into each explanation.
- **PS-017-01.R03** The explanation model is derived and stores nothing of its own.

## Specification

**Note:** Library module. The length-4 profile is a typed constant LengthProfile {length: 4, toleranceBps: 300, absoluteMinMajor: 3, maxPairBucket: 2 (10-25 km), imbalanceQuantumPermille: 10, minWantAgeMinutes: 15, maxOtherOpenCycles: 2, version: 'p4.1'} registered with F02.S02.M03; no records are owned.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T01 | unit | PS-017-01.R01, PS-017-03.R01 | read default profile | toleranceBps 300, absoluteMinMajor 3, maxPairBucket 2, maxOtherOpenCycles 2, version p4.1 |
| TEST-PS-017-09.T02 | unit | PS-017-01.R02, PS-017-02.R01 | overrides at and beyond bounds | out-of-bound rejected, in-bound recorded and shown |
| TEST-PS-017-09.T03 | unit | PS-017-01.R03, PS-017-02.R03, PS-017-09.R02 | golden 4-party explanation | gaps 100, 200, 300, 400 and tolerances 600, 600, 594, 597 exactly |
| TEST-PS-017-09.T13 | a11y | PS-017-01.R01 | explanation panel with dropout notice | axe zero serious issues |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
