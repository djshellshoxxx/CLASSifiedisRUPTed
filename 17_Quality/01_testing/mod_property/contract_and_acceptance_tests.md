# PS-136-09 — Contract and acceptance tests: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-136-09.R02** Self-tests prove that planted bugs (an off-by-one money split, a broken cycle checker, a state machine with a missing guard) are found within 200 runs.
- **PS-136-09.R03** The nightly profile is verified by a dry-run with numRuns 10 000 on a small property set in CI weekly.

## Specification

See the module test table below (all processes).

**Fixtures:** Base seed derived from commit SHA (pr) or Date seconds (nightly) and printed; FakeClock 2026-11-04T10:00:00Z; Money currencies EUR, JPY, KWD to cover 0, 2 and 3 minor digits; geo generators for raw lat/lon and cells of precision 6 to 9; statement generators over every registry type and every signer role; one open and one fixed regression file.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T01 | unit | PS-136-01.R01, PS-136-01.R02, PS-136-06.R01 | write a counterexample, reload it and replay before and after a planted fix | the JSON round-trips; replay on the unfixed code reproduces the failure; after the fix the same case passes as an expected-pass example |
| TEST-PS-136-09.T02 | unit | PS-136-01.R03, PS-136-02.R01 | run an invalid_money arbitrary and a normal one | normal arbitrary yields integer strings only; floats rejected with QUALITY_PROP_ARBITRARY_INVALID |
| TEST-PS-136-09.T03 | unit | PS-136-02.R02 | load properties with valid and invalid titles | invalid titles rejected with QUALITY_PROP_TITLE_INVALID |
| TEST-PS-136-09.T04 | unit | PS-136-02.R03, PS-136-04.R03 | property sleeping 11 s in pr profile | aborted with QUALITY_PROP_TIMEOUT and exit 2 |
| TEST-PS-136-09.T05 | property | PS-136-03.R01, PS-136-03.R02 | planted bug: money allocation drops 1 minor unit | found within 200 runs, shrunk, exit 1, no retry |
| TEST-PS-136-09.T06 | integration | PS-136-03.R03 | nightly workflow dry run with a planted counterexample | a classrup-regression/v1 file with status open is uploaded as an artifact and one issue is opened with the seed; nothing is committed and no pull request is opened |
| TEST-PS-136-09.T07 | unit | PS-136-04.R01, PS-136-04.R02 | invoke each documented script | reports/property.json and JUnit exist; exit codes as documented |
| TEST-PS-136-09.T08 | unit | PS-136-05.R01, PS-136-05.R02, PS-136-05.R03 | authorize() property with generated actors and capabilities | default deny holds for all 200 runs; import of secrets or network clients rejected |
| TEST-PS-136-09.T09 | property | PS-136-06.R01 | run the same seed twice | identical counterexamples and identical reports |
| TEST-PS-136-09.T10 | unit | PS-136-06.R03 | two properties mutate one test double | reset hook isolates them; lint rejects module-level mutable state |
| TEST-PS-136-09.T11 | unit | PS-136-07.R02, PS-136-07.R03 | inspect reports from a failing run | only minimal counterexample values present; seed printed |
| TEST-PS-136-09.T12 | load | PS-136-08.R01, PS-136-08.R02, PS-136-08.R03 | run all property suites in pr profile on 2 vCPU | finishes in at most 60 s and slow properties are flagged |
| TEST-PS-136-09.T13 | property | PS-136-09.R02 | planted bugs: off-by-one split, broken cycle checker, missing guard | each found in at most 200 runs |
| TEST-PS-136-09.T14 | integration | PS-136-09.R03 | weekly dry run of the nightly profile on a small set | 10 000 runs complete and the report lists numRuns 10000 |
| TEST-PS-136-09.T15 | unit | PS-136-10.R01 | confirm lint on hand-edited regression file | rejected without generator signature |
| TEST-PS-136-09.T16 | integration | PS-136-10.R02, PS-136-10.R03 | upgrade fast-check in a branch then revert | pinned 4.10.2 restored; regressions still replay |
| TEST-PS-136-09.T17 | property | PS-136-01.R04 | generate envelopes, reorder keys, flip one byte, and deliver conflicting promises in random orders | canonical bytes identical; mutated envelope rejected; fork detected in every order and coordination frozen |
| TEST-PS-136-09.T18 | integration | PS-136-06.R02 | snapshot the working tree, run the pr profile with a failing property, and diff the file system | only reports/ changed (including reports/regressions/); tests/property/regressions/ and all other paths are byte-identical |
| TEST-PS-136-09.T19 | integration | PS-136-09.R01 | tools/trace run over this module's spec and the JUnit report of a full property run | every requirement of this module maps to a passing test title |
| TEST-PS-136-09.T20 | abuse | PS-136-07.R01 | self-test scans property files for values not produced by tests/property/arbitraries and runs a property seeded with a literal personal-looking value | literal values outside the shared generators are rejected; every generated value carries the synthetic generator tag |
| TEST-PS-136-09.T21 | property | PS-136-02.R04 | geoprivacy - raw L4 points and precision 6 to 9 cells through publish, search and federation export builders and distance bucketing from shifted origins; planted leaks (precision-6 cell in a projection, raw km distance, radius 2 km accepted) | correct code holds for 200 runs; each planted leak is found within 200 runs and shrunk |
| TEST-PS-136-09.T22 | property | PS-136-01.R05 | statement trust - every type and signer-role pair outside the N2 registry, and random re-delivery sequences of accepted envelopes; planted bug (acceptance by a non-author applied) | outside pairs quarantined with signer_role_invalid and state unchanged; re-delivery state equals single delivery; planted bug found within 200 runs |
| TEST-PS-136-09.T23 | integration | PS-136-01.R02, PS-136-03.R03 | regression files - unparsable, unknown property ID, incompatible fast-check major, valid fixed case; a fix pull request run on the parent commit | first three fail with QUALITY_PROP_REGRESSION_STALE and exit 3; fixed case passes; parent-commit run of the new case fails as required |

## Acceptance criteria

- Every property runs at least 200 times on pull requests and exactly 10 000 times nightly, with the seed printed on failure.
- A planted off-by-one money split is detected within 200 runs and reported with a minimal counterexample.
- Replaying a recorded seed and path reproduces the failure deterministically.
- Property suites exist for money, matching, state machines, geohash and geoprivacy, idempotency, and signed statements with signer roles.
- No nightly counterexample is committed to main before its fix, and a fixed regression replays as an expected-pass example.

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
