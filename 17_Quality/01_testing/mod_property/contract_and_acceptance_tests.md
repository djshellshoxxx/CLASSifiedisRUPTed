# PS-136-09 — Contract and acceptance tests: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-136-09.R02** Self-tests prove that planted bugs (an off-by-one money split, a broken cycle checker, a state machine with a missing guard) are found within 200 runs.
- **PS-136-09.R03** The nightly profile is verified by a dry-run with numRuns 10 000 on a small property set in CI weekly.

## Specification

See the module test table below (all processes).

**Fixtures:** Base seed derived from commit SHA (pr) or Date seconds (nightly) and printed; FakeClock 2026-11-04T10:00:00Z; Money currencies EUR, JPY, KWD to cover 0, 2 and 3 minor digits.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T01 | unit | PS-136-01.R01, PS-136-01.R02, PS-136-06.R01 | write a counterexample, reload it and replay | the JSON round-trips and replay reproduces the same failure |
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T03 | unit | PS-136-02.R02 | load properties with valid and invalid titles | invalid titles rejected with QUALITY_PROP_TITLE_INVALID |
| TEST-PS-136-09.T04 | unit | PS-136-02.R03, PS-136-04.R03 | property sleeping 11 s in pr profile | aborted with QUALITY_PROP_TIMEOUT and exit 2 |
| TEST-PS-136-09.T05 | property | PS-136-03.R01, PS-136-03.R02 | planted bug: money allocation drops 1 minor unit | found within 200 runs, shrunk, exit 1, no retry |
| TEST-PS-136-09.T06 | integration | PS-136-03.R03, PS-136-07.R01 | nightly workflow dry run with a planted counterexample | a regression file and pull request body are generated with the seed |
| TEST-PS-136-09.T07 | unit | PS-136-04.R01, PS-136-04.R02 | invoke each documented script | reports/property.json and JUnit exist; exit codes as documented |
| TEST-PS-136-09.T08 | unit | PS-136-05.R01, PS-136-05.R02, PS-136-05.R03 | authorize() property with generated actors and capabilities | default deny holds for all 200 runs; import of secrets or network clients rejected |
| TEST-PS-136-09.T09 | property | PS-136-06.R01, PS-136-06.R02 | run the same seed twice | identical counterexamples and identical reports |
| TEST-PS-136-09.T10 | unit | PS-136-06.R03 | two properties mutate one test double | reset hook isolates them; lint rejects module-level mutable state |
| TEST-PS-136-09.T11 | unit | PS-136-07.R02, PS-136-07.R03 | inspect reports from a failing run | only minimal counterexample values present; seed printed |
| TEST-PS-136-09.T12 | load | PS-136-08.R01, PS-136-08.R02, PS-136-08.R03 | run all property suites in pr profile on 2 vCPU | finishes in at most 60 s and slow properties are flagged |
| TEST-PS-136-09.T13 | property | PS-136-09.R02 | planted bugs: off-by-one split, broken cycle checker, missing guard | each found in at most 200 runs |
| TEST-PS-136-09.T14 | integration | PS-136-09.R01, PS-136-09.R03 | weekly dry run of the nightly profile on a small set | 10 000 runs complete and the report lists numRuns 10000 |
| TEST-PS-136-09.T15 | unit | PS-136-07.R03, PS-136-10.R01 | confirm lint on hand-edited regression file | rejected without generator signature |
| TEST-PS-136-09.T16 | integration | PS-136-10.R02, PS-136-10.R03 | upgrade fast-check in a branch then revert | pinned 4.10.2 restored; regressions still replay |
| TEST-PS-136-09.T17 | property | PS-136-01.R04 | generate envelopes, reorder keys, flip one byte, and deliver conflicting promises in random orders | canonical bytes identical; mutated envelope rejected; fork detected in every order and coordination frozen |

## Acceptance criteria

- Every property runs at least 200 times on pull requests and exactly 10 000 times nightly, with the seed printed on failure.
- A planted off-by-one money split is detected within 200 runs and reported with a minimal counterexample.
- Replaying a recorded seed and path reproduces the failure deterministically.
- Property suites exist for money, matching, state machines, geohash and idempotency.

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
