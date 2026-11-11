# PS-016-02 — Validation rules: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-02.R01** Each feasibility check is a rule with a stable code and maps to one module error code returned to callers.
- **PS-016-02.R02** The tolerance rule implements MNY-5 exactly, toleranceBps of the larger side or the absolute minimum (the profile's reference amount, 5.00 EUR by default, converted to the settlement currency with the subject's pinned barter_normalization quote or, when none covers EUR, the toleranceRef rate sealed in the head snapshot, MNY-4 HALF_EVEN), whichever is greater, with the effective length profile read from this module's registry.
- **PS-016-02.R03** Checks never read another party's private records; they use own vault data, signed projections and statement contents only.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | C01 all participant DIDs distinct (participant uniqueness) | MUTINY_PARTICIPANT_DUPLICATE |
| V02 | C02 all inventory items distinct across legs | MUTINY_ITEM_DUPLICATE |
| V03 | C03 each own item is owned by the principal in the local inventory and each peer item's listing projection is authored by the giver DID | MUTINY_ITEM_NOT_OWNED |
| V04 | C04 each own item has available quantity ≥ leg quantity, not reserved elsewhere; each peer item is listed as published and unexpired | MUTINY_ITEM_UNAVAILABLE |
| V05 | C05 for each participant gap = absolute difference of given and received ≤ max(toleranceBps × larger side, absoluteMinRef converted to the settlement currency with the pinned quote or the snapshot toleranceRef) (MNY-5) unless a sealed compensation leg or an acceptedImbalances entry of the signed head snapshot naming that participant covers the excess; only signed sources (the revision snapshot) are read, never an unsigned local input | MUTINY_VALUE_OUT_OF_TOLERANCE |
| V06 | C06 every pinned FX quote is unexpired; less than 30 minutes left gives status warn and an expired quote gives fail | MUTINY_QUOTE_STALE |
| V07 | C07 every adjacent pair distance bucket ≤ the length-profile maxPairBucket and both participants' maxDistanceBucket, as integer ordinals of the F02.S02.M04 mapping (lt5=0 … gt50=4); the pair bucket is bucketBetween of the giver's listing cell and the receiver's want cell (both ≤ L2, assertPublicCell), and an L1-only cell counts as at least 3 | MUTINY_DISTANCE_EXCEEDED |
| V08 | C08 no participant is in another participant's local block list known to this vault | BLOCKED_PARTY |
| V09 | C09 each participant is opted in and not paused per projection | MUTINY_PARTICIPANT_INELIGIBLE |
| V10 | C10 cycle length ≤ every participant's maxCycleLength and ≤ tenant Lmax | MUTINY_CYCLE_TOO_LONG |
| V11 | C11 at propose or revision time: consentDeadline is between now + 1 h and now + 14 d for trade_proposal or now + 7 d for cycle, at most now + 24 h and ≤ earliestQuoteExpiry when the subject has more than one currency (N16), executionWindow between 1 d and 23 d, and (consentDeadline − now) + executionWindow ≤ 30 d | MUTINY_DEADLINE_INVALID |
| V12 | C12 no item has an unacknowledged automatic plausibility flag, and no open peer flag was raised on the item within this subject (F02.S04.M03) | MUTINY_VALUATION_DISPUTED |
| V13 | C13 the report used for a commit decision has evaluatedAt within the last 10 minutes | MUTINY_FEASIBILITY_STALE |
| V14 | C11 at consent or commit time checks only that the local clock is before consentDeadline; the range is not re-validated | EXPIRED |
| V15 | a LengthProfile registered for length L is returned only for subjects of length L, and the explanation or check of another length is refused | MUTINY_PROFILE_LENGTH_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T01 | unit | PS-016-01.R01, PS-016-01.R03, PS-016-02.R01, PS-016-09.R03 | each check C01..C13 failed in turn | corresponding error code returned and check marked fail |
| TEST-PS-016-09.T02 | unit | PS-016-02.R02 | gap exactly at tolerance, one minor unit above, and absolute minimum case | pass at boundary, fail one unit above, absolute minimum 500 applies when 5 percent is smaller |
| TEST-PS-016-09.T05 | unit | PS-016-02.R03, PS-016-07.R03 | peer item without local projection | check warn basis unverifiable, overall feasible_with_conditions |
| TEST-PS-016-09.T18 | unit | PS-016-02.R02 | absolute minimum reference 500 EUR minor converted with pinned quotes EUR->JPY 163/1 and EUR->BTC 1/60000 | 815 JPY and 8333 satoshi (HALF_EVEN, MNY-4); EUR settlement uses 500 unchanged |
| TEST-PS-016-09.T19 | unit | PS-016-02.R01, PS-016-03.R02 | C11 at revision time with a 30 h cross-currency deadline and a 14 d plus 23 d window; C11 at consent time 40 minutes before a 10-day trade proposal deadline; C06 with 20 minutes left and expired | MUTINY_DEADLINE_INVALID twice; consent allowed; warn then fail |
| TEST-PS-016-09.T22 | unit | PS-016-02.R03, PS-016-07.R03 | gap above tolerance with an unsigned local acceptance, then with an acceptedImbalances entry in the signed snapshot | first fails C05; second passes C05 with basis signed_projection |

## Dependencies

Module depends on: F02.S02.M04, F02.S01.M02, F02.S01.M03, F02.S04.M02, F02.S04.M03, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
