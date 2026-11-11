# PS-137-01 — Domain schema: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-01.R01** The module owns no persisted entities; the only artifacts are vitest.config.ts (test.projects node and browser-like, pool forks, isolate true, testTimeout 5000), shared setup files, the code-owned tests/quarantine.yaml and generated coverage reports under coverage/ which are git-ignored.
- **PS-137-01.R02** Fixtures define data shapes by importing the production schemas, so a schema change breaks fixtures at compile time rather than silently diverging.
- **PS-137-01.R03** Fixture data is synthetic only: no real names, emails, phone numbers or coordinates. Public fixtures use geohash cells of precision 5 or coarser; synthetic L3 cells (precision 6) and L4 exact coordinates exist only as fixtures marked P3 so leak tests can prove that public, search and federated outputs hold only the F06.S02.M01 snap of the input at precision 5 or coarser (CTR-PRV-001 PRV-1, PRV-3; N8 assertPublicCell).
- **PS-137-01.R04** Fixtures include MemoryVault (the storage/memory adapter), a seeded Ed25519 keypair factory and builders for CTR-FED-001 signed envelopes, so vault commands and statement verification run with no relay and no network.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T01 | unit | PS-137-01.R02, PS-137-01.R03, PS-137-07.R01 | fixtures built from production schemas are inspected by a test that scans values, and the fixture lint runs on a file holding a real-looking email and phone outside example.com and 555-01xx | every fixture validates against its schema and matches no real email or phone pattern; the lint rejects the planted values |
| TEST-PS-137-09.T05 | integration | PS-137-01.R01, PS-137-03.R02 | run suite and check git status afterwards | only coverage/ and .vitest-cache/ changed |
| TEST-PS-137-09.T17 | unit | PS-137-01.R04, PS-137-02.R04 | run an isomorphic package in both test.projects (node and browser-like) and add a node:fs import to core | both projects pass; the added import fails with QUALITY_UNIT_NODE_IMPORT_IN_CORE; a signed envelope built from fixtures verifies |
| TEST-PS-137-09.T20 | abuse | PS-137-01.R03 | canary leak - P3-marked L4 coordinates and an L3 cell fed through public projection, search document and federation export builders | every output cell equals snap(input) at precision 5 or coarser; the canary coordinates and the 6-character cell never appear; a planted leak fails with QUALITY_UNIT_PUBLIC_LEAK |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [module SPEC](SPEC.md).
