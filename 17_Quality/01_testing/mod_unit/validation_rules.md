# PS-137-02 — Validation rules: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-02.R01** A custom lint rule validates that every test title in packages with a module.spec.yaml starts with TEST-PS-NNN-PP.Tnn where NN is two digits.
- **PS-137-02.R02** The global setup rejects nondeterminism sources (Math.random, Date.now, argument-less new Date, global fetch, process.env reads not on an allow list) with a typed error.
- **PS-137-02.R03** Coverage thresholds are evaluated per package after the run and violations map to exactly one error code per package.
- **PS-137-02.R04** Unit suites of isomorphic packages run twice, in Node 22 and in a browser-like environment with fake-indexeddb and WebCrypto, and fail with QUALITY_UNIT_NODE_IMPORT_IN_CORE when core code imports node: modules.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Test title in a spec-covered package matches TEST-PS-<3 digits>-<01 to 10>.T<2 digits> | QUALITY_UNIT_TITLE_INVALID |
| V02 | Test code does not call Math.random, Date.now, new Date() without arguments or global fetch | QUALITY_UNIT_NONDETERMINISTIC |
| V03 | Core package line coverage is at least 85 %, functions 85 %, branches 80 %; other packages lines 70 % | QUALITY_UNIT_COVERAGE_BELOW |
| V04 | Every workspace package that has source files has at least one test file | QUALITY_UNIT_PACKAGE_UNTESTED |
| V05 | Single test duration is at most 5 000 ms | QUALITY_UNIT_TEST_TIMEOUT |
| V06 | Packages marked isomorphic import no node: module and not the Node-only subpath @classrup/kernel/node | QUALITY_UNIT_NODE_IMPORT_IN_CORE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T02 | unit | PS-137-02.R01 | lint rule run on files with valid and 6 malformed titles | valid titles accepted; each malformed title reported with QUALITY_UNIT_TITLE_INVALID |
| TEST-PS-137-09.T03 | unit | PS-137-02.R02, PS-137-03.R03 | test calls Math.random, Date.now, new Date(), fetch | each throws QUALITY_UNIT_NONDETERMINISTIC and the run exits 1 |
| TEST-PS-137-09.T04 | unit | PS-137-02.R03, PS-137-04.R03 | synthetic package at 84.9 % and 85.0 % lines | 84.9 % exits 2 with QUALITY_UNIT_COVERAGE_BELOW; 85.0 % passes |
| TEST-PS-137-09.T17 | unit | PS-137-01.R04, PS-137-02.R04 | run an isomorphic package in both environments and add a node:fs import to core | both environments pass; the added import fails with QUALITY_UNIT_NODE_IMPORT_IN_CORE; a signed envelope built from fixtures verifies |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
