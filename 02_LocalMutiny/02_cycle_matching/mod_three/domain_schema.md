# PS-020-01 — Domain schema: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-01.R01** The length-3 profile is a typed, versioned constant with the numeric defaults stated in the responsibilities and is registered at startup with the F02.S02.M05 LengthProfile registry, which the engine reads.
- **PS-020-01.R02** Overrides are accepted only within the stated bounds and the effective values and profile version are copied into every suggestion's explanation so later changes never rewrite history.
- **PS-020-01.R03** The explanation model is derived from the CycleSuggestion legs and local ports and stores nothing of its own.

## Specification

**Note:** Library module. The length-3 profile is a typed constant LengthProfile {length: 3, toleranceBps: 500, absoluteMinRef: {amount: '500', currency: 'EUR'}, maxPairBucket: 3 (25_50 per the F02.S02.M04 ordinal mapping), imbalanceQuantumPermille: 10, minWantAgeMinutes: 15, version: 'p3.2'} registered with the F02.S02.M05 LengthProfile registry; absoluteMinRef is converted to the settlement currency with the subject's pinned barter_normalization quote, or the toleranceRef rate sealed in the revision snapshot when no pinned quote covers EUR (F02.S04.M02), using MNY-4 HALF_EVEN; suggestions use the latest local quote and are advisory; overrides are tenant settings, not records owned here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01, PS-020-07.R03 | read default profile as principal and as relay-client | toleranceBps 500, absoluteMinRef 500 EUR minor, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.2; output carries no personal data |
| TEST-PS-020-09.T02 | unit | PS-020-01.R02, PS-020-02.R01 | override 1001 bps, 1000 bps, absolute minimum reference 10001 and 10000 EUR minor | 1001 and 10001 rejected, 1000 and 10000 accepted and recorded |
| TEST-PS-020-09.T03 | unit | PS-020-01.R03, PS-020-02.R03, PS-020-09.R02 | golden 3-party explanation | gaps 500, 200, 300 with tolerances 600, 600, 590 exactly as in the example |
| TEST-PS-020-09.T13 | a11y | PS-020-01.R01 | explanation panel | axe zero serious issues; sentence per participant readable |
| TEST-PS-020-09.T14 | unit | PS-020-02.R03, PS-020-01.R01 | BTC settlement fixture with pinned EUR->BTC 1/60000 (golden) | absolute minimum 8333 satoshi, never 5 BTC |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
