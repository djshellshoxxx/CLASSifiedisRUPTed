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
| TEST-PS-020-09.T01 | unit | PS-020-01.R01, PS-020-03.R01, PS-020-07.R03 | read default profile as principal and as relay-client | toleranceBps 500, absoluteMinRef 500 EUR minor, maxPairBucket 3, quantum 10, minWantAgeMinutes 15, version p3.2; output carries no personal data |
| TEST-PS-020-09.T02 | unit | PS-020-01.R02, PS-020-02.R01 | override 1001 bps, 1000 bps, absolute minimum reference 10001 and 10000 EUR minor | 1001 and 10001 rejected, 1000 and 10000 accepted and recorded |
| TEST-PS-020-09.T03 | unit | PS-020-01.R03, PS-020-02.R03, PS-020-09.R02 | golden 3-party explanation | gaps 500, 200, 300 with tolerances 600, 600, 590 exactly as in the example |
| TEST-PS-020-09.T04 | unit | PS-020-02.R02, PS-020-04.R03 | explain a 4-party suggestion | MUTINY_PROFILE_LENGTH_MISMATCH |
| TEST-PS-020-09.T05 | contract | PS-020-04.R01, PS-020-04.R02, PS-020-09.R03 | queries and engine events | outputs validate against registry; module emits no events and sends no statement |
| TEST-PS-020-09.T06 | unit | PS-020-02.R03, PS-020-07.R01 | JPY fixture with pinned EUR->JPY 163/1 (golden) | absolute minimum 815 JPY, gaps computed in bigint and formatting follows the currency; no negative information about absent people |
| TEST-PS-020-09.T07 | integration | PS-020-03.R02, PS-020-03.R03, PS-020-06.R03 | engine started without the length-3 profile registered | engine default profile used from the F02.S02.M05 registry and degraded diagnostic logged |
| TEST-PS-020-09.T08 | abuse | PS-020-05.R01, PS-020-05.R02, PS-020-05.R03, PS-020-07.R01 | other principal queries; explanation inspected for exclusions | NOT_FOUND; no negative information about absent people |
| TEST-PS-020-09.T09 | integration | PS-020-06.R01, PS-020-06.R02, PS-020-08.R02 | crash and restart | explanations rebuilt, computation within 10 ms |
| TEST-PS-020-09.T10 | unit | PS-020-08.R01, PS-020-08.R03 | engine run statistics | profile version p3.2 present, latency recorded locally only |
| TEST-PS-020-09.T11 | unit | PS-020-09.R01 | traceability tool run | every PS-020 requirement maps to a passing test |
| TEST-PS-020-09.T12 | integration | PS-020-10.R01, PS-020-10.R02, PS-020-10.R03 | export, import, rollback | no module records exported; profile version of imported suggestions retained |
| TEST-PS-020-09.T13 | a11y | PS-020-01.R01 | explanation panel | axe zero serious issues; sentence per participant readable |
| TEST-PS-020-09.T14 | unit | PS-020-02.R03, PS-020-01.R01 | BTC settlement fixture with pinned EUR->BTC 1/60000 (golden) | absolute minimum 8333 satoshi, never 5 BTC |
| TEST-PS-020-09.T15 | integration | PS-020-07.R02 | suggestion expires and is superseded with an injected clock | cached explanation dropped on next read and by the 60 s sweep; nothing remains after the suggestion is purged |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- The golden 3-party example reproduces gaps 500, 200, 300 and tolerances 600, 600, 590 exactly.
- The module emits no events and no statements and holds no records.

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
