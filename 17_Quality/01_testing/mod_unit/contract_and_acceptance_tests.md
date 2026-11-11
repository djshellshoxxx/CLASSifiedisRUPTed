# PS-137-09 — Contract and acceptance tests: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-09.R01** Every requirement of this module is covered by at least one automated test, using the mapping in section 09.
- **PS-137-09.R02** Tool self-tests run the lint rule and the nondeterminism guard against crafted fixtures to prove rejection.
- **PS-137-09.R03** The coverage gate itself is tested with a synthetic package below and above threshold.

## Specification

See the module test table below (all processes).

**Fixtures:** FakeClock starting 2026-11-04T10:00:00Z, SeqIdGenerator seed 1, PRNG seed 20261104, TZ=UTC, locale en-US; public cells u33db (precision 5) and u33d (precision 4); P3-marked synthetic L3 cell u33dbf and L4 point 52.51630,13.37770 used only by leak tests; a recorded 100-run JUnit history for the flake detector.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T01 | unit | PS-137-01.R02, PS-137-01.R03, PS-137-07.R01 | fixtures built from production schemas are inspected by a test that scans values, and the fixture lint runs on a file holding a real-looking email and phone outside example.com and 555-01xx | every fixture validates against its schema and matches no real email or phone pattern; the lint rejects the planted values |
| TEST-PS-137-09.T02 | unit | PS-137-02.R01 | lint rule run on files with valid and 6 malformed titles | valid titles accepted; each malformed title reported with QUALITY_UNIT_TITLE_INVALID |
| TEST-PS-137-09.T03 | unit | PS-137-02.R02 | test calls Math.random, Date.now, new Date(), fetch | each throws QUALITY_UNIT_NONDETERMINISTIC and the run exits 1 |
| TEST-PS-137-09.T04 | unit | PS-137-02.R03, PS-137-04.R03 | synthetic package at 84.9 % and 85.0 % lines | 84.9 % exits 2 with QUALITY_UNIT_COVERAGE_BELOW; 85.0 % passes |
| TEST-PS-137-09.T05 | integration | PS-137-01.R01, PS-137-03.R02 | run suite and check git status afterwards | only coverage/ and .vitest-cache/ changed |
| TEST-PS-137-09.T06 | integration | PS-137-03.R01, PS-137-06.R01 | run the suite twice with the same seed and clock | normalised JSON reports are byte-identical |
| TEST-PS-137-09.T07 | integration | PS-137-03.R03 | two test files mutate the same module-level fixture under the configured pool forks and isolate true | isolation keeps both green and the shared state is not visible across files |
| TEST-PS-137-09.T08 | integration | PS-137-04.R01, PS-137-04.R02 | execute each documented script | reports/unit.xml and reports/unit.json exist and parse |
| TEST-PS-137-09.T09 | unit | PS-137-05.R01, PS-137-05.R02 | import of relay session code from a unit test; pure authorize() with fixture actors | import rejected by dependency rule; authorize returns Allow and Deny for fixture roles |
| TEST-PS-137-09.T10 | integration | PS-137-05.R03 | build the production bundles and list their files | no test or fixture files present |
| TEST-PS-137-09.T11 | unit | PS-137-06.R03 | configure retry and run an intermittent test | retry is 0 and the intermittent test fails the run |
| TEST-PS-137-09.T12 | abuse | PS-137-02.R03, PS-137-06.R03 | commit that lowers a threshold and a file with it.skip outside tests/quarantine.yaml | code-owner check flags the threshold change; lint rejects it.skip with QUALITY_UNIT_QUARANTINE_INVALID |
| TEST-PS-137-09.T13 | abuse | PS-137-07.R02, PS-137-07.R03 | run with a canary secret in the shell environment and an env read outside the allow list | canary absent from every artifact, snapshot and from test process env; the read is refused |
| TEST-PS-137-09.T14 | load | PS-137-08.R01, PS-137-08.R02, PS-137-08.R03 | run the full workspace unit suite on the 2 vCPU CI profile | wall time at most 60 s, per package at most 5 s, slowest list printed |
| TEST-PS-137-09.T15 | unit | PS-137-09.R01, PS-137-09.R02, PS-137-09.R03 | run the module's self-tests | all tool self-tests pass and every requirement ID maps to a test title |
| TEST-PS-137-09.T16 | integration | PS-137-10.R01, PS-137-10.R02, PS-137-10.R03 | upgrade vitest in a branch with a lockfile change, then revert it | suite results identical before and after revert; no stored data is involved |
| TEST-PS-137-09.T17 | unit | PS-137-01.R04, PS-137-02.R04 | run an isomorphic package in both test.projects (node and browser-like) and add a node:fs import to core | both projects pass; the added import fails with QUALITY_UNIT_NODE_IMPORT_IN_CORE; a signed envelope built from fixtures verifies |
| TEST-PS-137-09.T18 | unit | PS-137-06.R02 | force a failing test that uses FakeClock, SeqIdGenerator and the seeded PRNG, then run the printed replay command | the failure output prints the seed, the FakeClock start time and the SeqIdGenerator offset; the replay command reproduces the same failure |
| TEST-PS-137-09.T19 | integration | PS-137-06.R03, PS-137-07.R01 | flake detector over a recorded history of 100 runs with 1 failure of one test; then a quarantine entry with expiresAt in the past and one 15 days long | the detector opens one issue with the proposed entry; the listed test runs in the non-blocking quarantine project; the expired entry fails the gate as an expired waiver and the 15-day entry fails with QUALITY_UNIT_QUARANTINE_INVALID |
| TEST-PS-137-09.T20 | abuse | PS-137-01.R03 | canary leak - P3-marked L4 coordinates and an L3 cell fed through public projection, search document and federation export builders | every output cell equals snap(input) at precision 5 or coarser; the canary coordinates and the 6-character cell never appear; a planted leak fails with QUALITY_UNIT_PUBLIC_LEAK |

## Acceptance criteria

- pnpm test:unit finishes under 60 s on the 2 vCPU reference runner with zero failures.
- Every core package reports at least 85 % line coverage and a lowered threshold cannot merge without a code-owner approval.
- A deliberately introduced Date.now call in a test is rejected with QUALITY_UNIT_NONDETERMINISTIC.
- Every test title in covered packages carries a valid TEST-PS-NNN-PP.Tnn ID.
- A test is taken out of the blocking run only through an unexpired tests/quarantine.yaml entry, and an expired entry fails the release gate.

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
