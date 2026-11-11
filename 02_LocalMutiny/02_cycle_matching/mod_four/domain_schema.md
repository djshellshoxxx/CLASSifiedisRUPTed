# PS-017-01 — Domain schema: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-01.R01** The length-4 profile is a typed, versioned constant with the FLOW-05 per-leg tolerance and the stricter distance stated above and is registered at startup with the F02.S02.M05 registry, which the engine reads.
- **PS-017-01.R02** Overrides are accepted only inside bounds (tolerance 0..1000 bps, absolute minimum reference 0..100.00 EUR, pair bucket ordinal 0..4) and effective values are copied into each explanation.
- **PS-017-01.R03** The explanation model is derived and stores nothing of its own.

## Specification

**Note:** Library module. The length-4 profile is a typed constant LengthProfile {length: 4, toleranceBps: 500 (per leg, FLOW-05), absoluteMinRef: {amount: '500', currency: 'EUR'}, maxPairBucket: 2 (10_25 per the F02.S02.M04 ordinal mapping), imbalanceQuantumPermille: 10, minWantAgeMinutes: 15, maxOtherOpenCycles: 2 (consent-time guard in F02.S03.M01), version: 'p4.2'} registered with the F02.S02.M05 LengthProfile registry; no records are owned.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T01 | unit | PS-017-01.R01, PS-017-03.R01 | read default profile | toleranceBps 500, absoluteMinRef 500 EUR minor, maxPairBucket 2, maxOtherOpenCycles 2, version p4.2 |
| TEST-PS-017-09.T02 | unit | PS-017-01.R02, PS-017-02.R01 | overrides at and beyond bounds | out-of-bound rejected, in-bound recorded and shown |
| TEST-PS-017-09.T03 | unit | PS-017-01.R03, PS-017-02.R03, PS-017-09.R02 | golden 4-party explanation (regenerated for FLOW-05) | gaps 100, 200, 300, 400 and tolerances 1000, 1000, 990, 995 exactly; same values as the FLOW-05 integration test |
| TEST-PS-017-09.T13 | a11y | PS-017-01.R01 | explanation panel with dropout notice | axe zero serious issues |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
