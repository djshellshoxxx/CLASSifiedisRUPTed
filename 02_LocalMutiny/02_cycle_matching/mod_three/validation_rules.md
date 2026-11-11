# PS-020-02 — Validation rules: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-02.R01** Profile overrides are validated against bounds before they take effect.
- **PS-020-02.R02** The explanation query validates that the subject is a 3-party suggestion owned by the caller's vault.
- **PS-020-02.R03** All amounts in the explanation are computed with bigint arithmetic in the cycle settlement currency.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | toleranceBps override is an integer in 0..1000 | VALIDATION_FAILED |
| V02 | absoluteMinRef override is an integer amount of EUR minor units in 0..10000 | VALIDATION_FAILED |
| V03 | explanation subject exists in this vault and its length equals 3 | MUTINY_PROFILE_LENGTH_MISMATCH |
| V04 | maxPairBucket override is an integer ordinal within 0..4 of the F02.S02.M04 mapping (lt5=0, 5_10=1, 10_25=2, 25_50=3, gt50=4) | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T02 | unit | PS-020-01.R02, PS-020-02.R01 | override 1001 bps, 1000 bps, absolute minimum reference 10001 and 10000 EUR minor | 1001 and 10001 rejected, 1000 and 10000 accepted and recorded |
| TEST-PS-020-09.T03 | unit | PS-020-01.R03, PS-020-02.R03, PS-020-09.R02 | golden 3-party explanation | gaps 500, 200, 300 with tolerances 600, 600, 590 exactly as in the example |
| TEST-PS-020-09.T04 | unit | PS-020-02.R02, PS-020-04.R03 | explain a 4-party suggestion | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-020-09.T06 | unit | PS-020-02.R03, PS-020-07.R01 | JPY fixture with pinned EUR->JPY 163/1 (golden) | absolute minimum 815 JPY, gaps computed in bigint and formatting follows the currency; no negative information about absent people |
| TEST-PS-020-09.T14 | unit | PS-020-02.R03, PS-020-01.R01 | BTC settlement fixture with pinned EUR->BTC 1/60000 (golden) | absolute minimum 8333 satoshi, never 5 BTC |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
