# PS-143-01 — Domain schema: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-01.R01** The module owns no persisted entities; reports/gates.json (schema classrup-gates-report/v1) records each gate verdict, evidence and timestamp.
- **PS-143-01.R02** The trace matrix reports/trace.json maps each requirement ID to test IDs and results, covering all modules with a module.spec.yaml.
- **PS-143-01.R03** Evidence references are file paths and counts; reports contain no user data.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T01 | unit | PS-143-01.R01, PS-143-01.R03, PS-143-06.R01 | generate gates.json on the full-coverage repo | schema valid; no user data fields; verdict GO |
| TEST-PS-143-09.T02 | unit | PS-143-01.R02, PS-143-02.R01, PS-143-09.R02 | synthetic repos: gap, skipped test, duplicate ID | QUALITY_GATE_TRACE_GAP and QUALITY_GATE_TRACE_DUPLICATE; skipped test not counted |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01. Predecessor: [module SPEC](SPEC.md).
