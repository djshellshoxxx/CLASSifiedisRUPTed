# PS-017-09 — Contract and acceptance tests: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-017-09.R02** The 4-party worked example is a golden test with exact bigint outputs.
- **PS-017-09.R03** The module is tested for emitting no events and sending no statements.

## Specification

See the module test table below (all processes).

**Fixtures:** 4-party values 20000, 19800, 19500, 19900 EUR minor; pair distance fixtures with one 30 km edge; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T01 | unit | PS-017-01.R01, PS-017-03.R01 | read default profile | toleranceBps 500, absoluteMinRef 500 EUR minor, maxPairBucket 2, maxOtherOpenCycles 2, version p4.2 |
| TEST-PS-017-09.T02 | unit | PS-017-01.R02, PS-017-02.R01 | overrides at and beyond bounds | out-of-bound rejected, in-bound recorded and shown |
| TEST-PS-017-09.T03 | unit | PS-017-01.R03, PS-017-02.R03, PS-017-09.R02 | golden 4-party explanation (regenerated for FLOW-05) | gaps 100, 200, 300, 400 and tolerances 1000, 1000, 990, 995 exactly; same values as the FLOW-05 integration test |
| TEST-PS-017-09.T04 | unit | PS-017-02.R02, PS-017-04.R03 | a 3-party suggestion explained as 4-party | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-017-09.T05 | unit | PS-017-02.R02 | ring with one 25_50 edge and one participant with maxCycleLength 3 | MUTINY_FOUR_DISTANCE and MUTINY_FOUR_LENGTH_PREFERENCE; no overload rule is evaluated at suggestion time |
| TEST-PS-017-09.T06 | contract | PS-017-04.R01, PS-017-04.R02, PS-017-09.R03 | queries and engine events | outputs validate against registry; no events or statements from this module |
| TEST-PS-017-09.T07 | integration | PS-017-03.R02, PS-017-03.R03, PS-017-06.R02 | engine started without provider | engine default profile used and degraded diagnostic logged; never the 3-party profile |
| TEST-PS-017-09.T08 | abuse | PS-017-05.R01, PS-017-05.R02, PS-017-05.R03, PS-017-07.R01 | other principal queries; explanation inspected | NOT_FOUND; no block or exclusion information |
| TEST-PS-017-09.T09 | integration | PS-017-06.R01, PS-017-06.R03, PS-017-07.R02, PS-017-08.R02 | crash and restart | explanations rebuilt within 10 ms and cache purged with suggestion |
| TEST-PS-017-09.T10 | unit | PS-017-07.R03, PS-017-08.R01, PS-017-08.R03 | suggestion with a participant holding 3 other open cycles; run statistics | suggestion produced, no load input read; consent-time guard of F02.S03.M01 refuses only in that participant's vault; profile version p4.2 in stats; latency recorded locally |
| TEST-PS-017-09.T11 | unit | PS-017-09.R01 | traceability tool run | every PS-017 requirement maps to a passing test |
| TEST-PS-017-09.T12 | integration | PS-017-10.R01, PS-017-10.R02, PS-017-10.R03 | export, import, rollback | no module records exported; profile version retained on imported suggestions |
| TEST-PS-017-09.T13 | a11y | PS-017-01.R01 | explanation panel with dropout notice | axe zero serious issues |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- The golden 4-party example reproduces gaps 100, 200, 300, 400 and tolerances 1000, 1000, 990, 995 exactly, matching FLOW-05.
- The module emits no events and no statements and holds no records.

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
