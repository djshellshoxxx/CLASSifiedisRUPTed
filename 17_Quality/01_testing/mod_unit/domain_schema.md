# PS-137-01 — Domain schema: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-01.R01** The module owns no persisted entities; the only artifacts are vitest.config.ts, vitest.workspace.ts, shared setup files and generated coverage reports under coverage/ which are git-ignored.
- **PS-137-01.R02** Fixtures define data shapes by importing the production schemas, so a schema change breaks fixtures at compile time rather than silently diverging.
- **PS-137-01.R03** Fixture data is synthetic only: no real names, emails, phone numbers or coordinates; coordinates use fixed points in a test geohash at precision 5.
- **PS-137-01.R04** Fixtures include MemoryVault (the storage/memory adapter), a seeded Ed25519 keypair factory and builders for CTR-FED-001 signed envelopes, so vault commands and statement verification run with no relay and no network.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T01 | unit | PS-137-01.R02, PS-137-01.R03 | fixtures built from production schemas are inspected by a test that scans values | every fixture validates against its schema and matches no real email or phone pattern |
| TEST-PS-137-09.T05 | integration | PS-137-01.R01, PS-137-03.R02 | run suite and check git status afterwards | only coverage/ and .vitest-cache/ changed |
| TEST-PS-137-09.T17 | unit | PS-137-01.R04, PS-137-02.R04 | run an isomorphic package in both environments and add a node:fs import to core | both environments pass; the added import fails with QUALITY_UNIT_NODE_IMPORT_IN_CORE; a signed envelope built from fixtures verifies |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
