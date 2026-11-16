# PS-136-01 — Domain schema: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-01.R01** The module owns no persisted entities; regression counterexamples are stored as JSON files in tests/property/regressions/ versioned in git.
- **PS-136-01.R02** Each regression file records property ID, fast-check version, seed, path and the shrunk value so it can be replayed as a plain example.
- **PS-136-01.R03** Arbitraries are derived from production schemas and never construct invalid Money (non-integer or negative amount strings) unless an invalid-input arbitrary is named explicitly.
- **PS-136-01.R04** Envelope properties are included: JCS canonical bytes are stable under object key reordering, any single-byte mutation of a signed envelope fails verification, and two conflicting signed promises on the same subject are detected as a fork regardless of delivery order and never resolved by last-writer-wins.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T01 | unit | PS-136-01.R01, PS-136-01.R02, PS-136-06.R01 | write a counterexample, reload it and replay | the JSON round-trips and replay reproduces the same failure |
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T17 | property | PS-136-01.R04 | generate envelopes, reorder keys, flip one byte, and deliver conflicting promises in random orders | canonical bytes identical; mutated envelope rejected; fork detected in every order and coordination frozen |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [module SPEC](SPEC.md).
