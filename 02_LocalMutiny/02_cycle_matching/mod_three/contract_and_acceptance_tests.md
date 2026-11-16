# PS-020-09 — Contract and acceptance tests: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-020-09.R02** The 3-party worked example is a golden test with exact bigint outputs.
- **PS-020-09.R03** The module is tested for emitting no events and no statements.

## Specification

See the module test table below (all processes).

**Fixtures:** 3-party values 12000, 11800, 11500 EUR minor; JPY variant 12000, 11800, 11500 yen; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01 | read default profile | toleranceBps 500, absoluteMinMajor 5, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.1 |
| TEST-PS-020-09.T02 | unit | PS-020-01.R02, PS-020-02.R01 | override 1001 bps, 1000 bps, absolute minimum 101 and 100 | 1001 and 101 rejected, 1000 and 100 accepted and recorded |
| TEST-PS-020-09.T03 | unit | PS-020-01.R03, PS-020-02.R03, PS-020-09.R02 | golden 3-party explanation | gaps 500, 200, 300 with tolerances 600, 600, 590 exactly as in the example |
| TEST-PS-020-09.T04 | unit | PS-020-02.R02, PS-020-04.R03 | explain a 4-party suggestion | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-020-09.T05 | contract | PS-020-04.R01, PS-020-04.R02, PS-020-09.R03 | queries and engine events | outputs validate against registry; module emits no events and sends no statement |
| TEST-PS-020-09.T06 | unit | PS-020-02.R03, PS-020-07.R01 | JPY fixture | absolute minimum is 5 minor units and formatting follows the currency |
| TEST-PS-020-09.T07 | integration | PS-020-03.R02, PS-020-03.R03, PS-020-06.R03, PS-020-07.R02, PS-020-07.R03 | engine started without provider | engine default profile used and degraded diagnostic logged |
| TEST-PS-020-09.T08 | abuse | PS-020-05.R01, PS-020-05.R02, PS-020-05.R03, PS-020-07.R01 | other principal queries; explanation inspected for exclusions | NOT_FOUND; no negative information about absent people |
| TEST-PS-020-09.T09 | integration | PS-020-06.R01, PS-020-06.R02, PS-020-08.R02 | crash and restart | explanations rebuilt, computation within 10 ms |
| TEST-PS-020-09.T10 | unit | PS-020-08.R01, PS-020-08.R03 | engine run statistics | profile version p3.1 present, latency recorded locally only |
| TEST-PS-020-09.T11 | unit | PS-020-09.R01 | traceability tool run | every PS-020 requirement maps to a passing test |
| TEST-PS-020-09.T12 | integration | PS-020-10.R01, PS-020-10.R02, PS-020-10.R03 | export, import, rollback | no module records exported; profile version of imported suggestions retained |
| TEST-PS-020-09.T13 | a11y | PS-020-01.R01 | explanation panel | axe zero serious issues; sentence per participant readable |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- The golden 3-party example reproduces gaps 500, 200, 300 and tolerances 600, 600, 590 exactly.
- The module emits no events and no statements and holds no records.

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
