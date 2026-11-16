# PS-017-02 — Validation rules: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-02.R01** Admission rules specific to 4-party cycles are evaluated by the engine through this module's provider and reported with stable reason codes.
- **PS-017-02.R02** Overrides are validated against bounds before taking effect.
- **PS-017-02.R03** Amount arithmetic uses bigint and the settlement currency exponent.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | toleranceBps override is an integer in 0..1000 | VALIDATION_FAILED |
| V02 | every participant has maxCycleLength ≥ 4 | MUTINY_FOUR_LENGTH_PREFERENCE |
| V03 | every adjacent pair distance bucket ≤ 2 (10-25 km) | MUTINY_FOUR_DISTANCE |
| V04 | no participant has more than 2 other non-terminal cycles in the proposer's knowledge | MUTINY_PARTICIPANT_OVERLOADED |
| V05 | explanation subject exists in this vault and has length 4 | MUTINY_PROFILE_LENGTH_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T02 | unit | PS-017-01.R02, PS-017-02.R01 | overrides at and beyond bounds | out-of-bound rejected, in-bound recorded and shown |
| TEST-PS-017-09.T03 | unit | PS-017-01.R03, PS-017-02.R03, PS-017-09.R02 | golden 4-party explanation | gaps 100, 200, 300, 400 and tolerances 600, 600, 594, 597 exactly |
| TEST-PS-017-09.T04 | unit | PS-017-02.R02, PS-017-04.R03 | a 3-party suggestion explained as 4-party | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-017-09.T05 | unit | PS-017-02.R02 | ring with one 30 km edge, one participant with maxCycleLength 3, one with 3 other open cycles | MUTINY_FOUR_DISTANCE, MUTINY_FOUR_LENGTH_PREFERENCE, MUTINY_PARTICIPANT_OVERLOADED |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
