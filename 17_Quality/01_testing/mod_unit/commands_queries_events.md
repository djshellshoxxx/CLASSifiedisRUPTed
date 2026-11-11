# PS-137-04 — Commands, queries and events: Unit testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M01 Unit testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/unit-conventions` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-137-04.R01** The module exposes the scripts pnpm test:unit, pnpm test:unit --coverage, and pnpm test:unit --changed for local use.
- **PS-137-04.R02** The interface emits no relay events; run results are JUnit XML at reports/unit.xml and JSON at reports/unit.json.
- **PS-137-04.R03** Exit codes are documented: 0 pass, 1 test failure, 2 coverage threshold failure, 3 configuration or lint failure.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_UNIT_TITLE_INVALID | 422 | no | test title does not start with a valid TEST-PS-NNN-PP.Tnn ID (lint exit 3) |
| QUALITY_UNIT_NONDETERMINISTIC | 422 | no | test reached an uninjected clock, random source or network (run exit 1) |
| QUALITY_UNIT_COVERAGE_BELOW | 422 | no | package coverage under its threshold (exit 2) |
| QUALITY_UNIT_PACKAGE_UNTESTED | 422 | no | package with sources has no test files (exit 2) |
| QUALITY_UNIT_TEST_TIMEOUT | 422 | no | a test exceeded the 5 s timeout (exit 1) |
| QUALITY_UNIT_NODE_IMPORT_IN_CORE | 422 | no | isomorphic core code imports a Node-only module (exit 3) |
| QUALITY_UNIT_QUARANTINE_INVALID | 422 | no | quarantine entry malformed, longer than 14 days, or a skip marker outside tests/quarantine.yaml (lint exit 3) |
| QUALITY_UNIT_PUBLIC_LEAK | 422 | no | a P3-marked L3 or L4 fixture value or a cell finer than precision 5 reached a public, search or federated output (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:unit --coverage
  packages/money            lines 96.2 %  branches 91.0 %  OK
  packages/mutiny           lines 83.9 %  threshold 85 %  QUALITY_UNIT_COVERAGE_BELOW
  exit 2
$ pnpm test:unit packages/money -t TEST-PS-137-09.T01
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-137-09.T04 | unit | PS-137-02.R03, PS-137-04.R03 | synthetic package at 84.9 % and 85.0 % lines | 84.9 % exits 2 with QUALITY_UNIT_COVERAGE_BELOW; 85.0 % passes |
| TEST-PS-137-09.T08 | integration | PS-137-04.R01, PS-137-04.R02 | execute each documented script | reports/unit.xml and reports/unit.json exist and parse |

## Dependencies

Module depends on: CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
