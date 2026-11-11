# PS-137-09 — Contract and acceptance tests: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-09.R01** Every requirement of this module is covered by at least one automated test, using the mapping in section 09.
- **PS-137-09.R02** Tool self-tests run the lint rule and the nondeterminism guard against crafted fixtures to prove rejection.
- **PS-137-09.R03** The coverage gate itself is tested with a synthetic package below and above threshold.

## Specification

See the module test table below (all processes).

**Fixtures:** FakeClock starting 2026-11-04T10:00:00Z, SeqIdGenerator seed 1, PRNG seed 20261104, TZ=UTC, locale en-US.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T01 | unit | PS-137-01.R02, PS-137-01.R03 | fixtures built from production schemas are inspected by a test that scans values | every fixture validates against its schema and matches no real email or phone pattern |
| TEST-PS-137-09.T02 | unit | PS-137-02.R01 | lint rule run on files with valid and 6 malformed titles | valid titles accepted; each malformed title reported with QUALITY_UNIT_TITLE_INVALID |
| TEST-PS-137-09.T03 | unit | PS-137-02.R02, PS-137-03.R03 | test calls Math.random, Date.now, new Date(), fetch | each throws QUALITY_UNIT_NONDETERMINISTIC and the run exits 1 |
| TEST-PS-137-09.T04 | unit | PS-137-02.R03, PS-137-04.R03 | synthetic package at 84.9 % and 85.0 % lines | 84.9 % exits 2 with QUALITY_UNIT_COVERAGE_BELOW; 85.0 % passes |
| TEST-PS-137-09.T05 | integration | PS-137-01.R01, PS-137-03.R02 | run suite and check git status afterwards | only coverage/ and .vitest-cache/ changed |
| TEST-PS-137-09.T06 | integration | PS-137-03.R01, PS-137-06.R01 | run the suite twice with the same seed and clock | normalised JSON reports are byte-identical |
| TEST-PS-137-09.T07 | integration | PS-137-03.R03, PS-137-06.R02 | two test files mutate the same module-level fixture | isolation keeps both green and the shared state is not visible across files |
| TEST-PS-137-09.T08 | integration | PS-137-04.R01, PS-137-04.R02 | execute each documented script | reports/unit.xml and reports/unit.json exist and parse |
| TEST-PS-137-09.T09 | unit | PS-137-05.R01, PS-137-05.R02 | import of relay session code from a unit test; pure authorize() with fixture actors | import rejected by dependency rule; authorize returns Allow and Deny for fixture roles |
| TEST-PS-137-09.T10 | integration | PS-137-05.R03 | build the production bundles and list their files | no test or fixture files present |
| TEST-PS-137-09.T11 | unit | PS-137-06.R03 | configure retry and run an intermittent test | retry is 0 and the intermittent test fails the run |
| TEST-PS-137-09.T12 | abuse | PS-137-07.R01, PS-137-07.R03 | commit that lowers a threshold and a file with it.skip | code-owner check flags the threshold change; lint rejects it.skip |
| TEST-PS-137-09.T13 | abuse | PS-137-07.R02 | run with a canary secret in the shell environment | canary absent from every artifact and from test process env |
| TEST-PS-137-09.T14 | load | PS-137-08.R01, PS-137-08.R02, PS-137-08.R03 | run the full workspace unit suite on the 2 vCPU CI profile | wall time at most 60 s, per package at most 5 s, slowest list printed |
| TEST-PS-137-09.T15 | unit | PS-137-09.R01, PS-137-09.R02, PS-137-09.R03 | run the module's self-tests | all tool self-tests pass and every requirement ID maps to a test title |
| TEST-PS-137-09.T16 | integration | PS-137-10.R01, PS-137-10.R02, PS-137-10.R03 | upgrade vitest in a branch with a lockfile change, then revert it | suite results identical before and after revert; no stored data is involved |
| TEST-PS-137-09.T17 | unit | PS-137-01.R04, PS-137-02.R04 | run an isomorphic package in both environments and add a node:fs import to core | both environments pass; the added import fails with QUALITY_UNIT_NODE_IMPORT_IN_CORE; a signed envelope built from fixtures verifies |

## Acceptance criteria

- pnpm test:unit finishes under 60 s on the 2 vCPU reference runner with zero failures.
- Every core package reports at least 85 % line coverage and a lowered threshold cannot merge without a code-owner approval.
- A deliberately introduced Date.now call in a test is rejected with QUALITY_UNIT_NONDETERMINISTIC.
- Every test title in covered packages carries a valid TEST-PS-NNN-PP.Tnn ID.

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
