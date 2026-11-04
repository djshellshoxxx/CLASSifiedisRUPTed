# PS-016-02 — Validation rules: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-02.R01** Each feasibility check is a rule with a stable code and maps to one module error code returned to callers.
- **PS-016-02.R02** The tolerance rule implements MNY-5 exactly, 5 percent of the larger side or the configured absolute minimum, whichever is greater, with the stricter length-profile values from F02.S02.M01 and F02.S02.M02.
- **PS-016-02.R03** Checks never read another party's private records; they use own vault data, signed projections and statement contents only.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | C01 all participant DIDs distinct (participant uniqueness) | MUTINY_PARTICIPANT_DUPLICATE |
| V02 | C02 all inventory items distinct across legs | MUTINY_ITEM_DUPLICATE |
| V03 | C03 each own item is owned by the principal in the local inventory and each peer item's listing projection is authored by the giver DID | MUTINY_ITEM_NOT_OWNED |
| V04 | C04 each own item has available quantity ≥ leg quantity, not reserved elsewhere; each peer item is listed as published and unexpired | MUTINY_ITEM_UNAVAILABLE |
| V05 | C05 for each participant gap = absolute difference of given and received ≤ max(toleranceBps × larger side, absoluteMin) in settlement currency (MNY-5) unless compensation or a signed acceptedImbalance covers the excess | MUTINY_VALUE_OUT_OF_TOLERANCE |
| V06 | C06 every pinned FX quote is unexpired with ≥ 30 minutes left | MUTINY_QUOTE_STALE |
| V07 | C07 every adjacent pair distance bucket ≤ length-profile maximum and both participants' maxDistanceBucket | MUTINY_DISTANCE_EXCEEDED |
| V08 | C08 no participant is in another participant's local block list known to this vault | BLOCKED_PARTY |
| V09 | C09 each participant is opted in and not paused per projection | MUTINY_PARTICIPANT_INELIGIBLE |
| V10 | C10 cycle length ≤ every participant's maxCycleLength and ≤ tenant Lmax | MUTINY_CYCLE_TOO_LONG |
| V11 | C11 consentDeadline is between now + 1 h and now + 7 d and executionWindow between 1 d and 30 d | MUTINY_DEADLINE_INVALID |
| V12 | C12 no item has an open flag in a valuation dispute that the owner has not acknowledged | MUTINY_VALUATION_DISPUTED |
| V13 | C13 the report used for a commit decision has evaluatedAt within the last 10 minutes | MUTINY_FEASIBILITY_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T01 | unit | PS-016-01.R01, PS-016-01.R03, PS-016-02.R01, PS-016-09.R03 | each check C01..C13 failed in turn | corresponding error code returned and check marked fail |
| TEST-PS-016-09.T02 | unit | PS-016-02.R02 | gap exactly at tolerance, one minor unit above, and absolute minimum case | pass at boundary, fail one unit above, absolute minimum 500 applies when 5 percent is smaller |
| TEST-PS-016-09.T05 | unit | PS-016-02.R03, PS-016-07.R03 | peer item without local projection | check warn basis unverifiable, overall feasible_with_conditions |

## Dependencies

Module depends on: F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
