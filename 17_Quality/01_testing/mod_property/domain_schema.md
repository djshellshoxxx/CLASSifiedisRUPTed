# PS-136-01 — Domain schema: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-01.R01** The module owns no persisted entities; fixed regression cases are stored as JSON files in tests/property/regressions/ versioned in git, and open cases exist only as CI artifacts and issues.
- **PS-136-01.R02** Each regression file (classrup-regression/v1) records property ID, generator ID and version, fast-check version, seed, path, the shrunk concrete value, status open or fixed, and the expectation that the property holds for that value, so it replays as a plain expected-pass example.
- **PS-136-01.R03** Arbitraries are derived from production schemas and never construct invalid Money (non-integer or negative amount strings) unless an invalid-input arbitrary is named explicitly.
- **PS-136-01.R04** Envelope properties are included: JCS canonical bytes are stable under object key reordering, any single-byte mutation of a signed envelope fails verification, and two conflicting signed promises on the same subject are detected as a fork regardless of delivery order and never resolved by last-writer-wins.
- **PS-136-01.R05** Statement-trust properties are included: for any generated (statement type, signer role) pair that the F11.S01.M01 statement registry (N2) does not allow, the receiving vault quarantines the statement with reason signer_role_invalid and its state is unchanged; re-delivering any accepted envelope any number of times and in any order yields the same vault state as one delivery (dedupe by cid, CTR-FED-001 FED-7).

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T01 | unit | PS-136-01.R01, PS-136-01.R02, PS-136-06.R01 | write a counterexample, reload it and replay before and after a planted fix | the JSON round-trips; replay on the unfixed code reproduces the failure; after the fix the same case passes as an expected-pass example |
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T17 | property | PS-136-01.R04 | generate envelopes, reorder keys, flip one byte, and deliver conflicting promises in random orders | canonical bytes identical; mutated envelope rejected; fork detected in every order and coordination frozen |
| TEST-PS-136-09.T22 | property | PS-136-01.R05 | statement trust - every type and signer-role pair outside the N2 registry, and random re-delivery sequences of accepted envelopes; planted bug (acceptance by a non-author applied) | outside pairs quarantined with signer_role_invalid and state unchanged; re-delivery state equals single delivery; planted bug found within 200 runs |
| TEST-PS-136-09.T23 | integration | PS-136-01.R02, PS-136-03.R03 | regression files - unparsable, unknown property ID, incompatible fast-check major, valid fixed case; a fix pull request run on the parent commit | first three fail with QUALITY_PROP_REGRESSION_STALE and exit 3; fixed case passes; parent-commit run of the new case fails as required |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [module SPEC](SPEC.md).
