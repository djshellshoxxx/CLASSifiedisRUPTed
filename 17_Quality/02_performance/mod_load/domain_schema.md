# PS-139-01 — Domain schema: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-01.R01** The module owns no persisted entities; it produces reports/load.json (schema classrup-load-report/v1) with scenario results and environment details.
- **PS-139-01.R02** The report records relay commit SHA, Node version, CPU model, memory, disk type, seed and profile so runs are comparable.
- **PS-139-01.R03** Seed datasets are synthetic and deterministic from seed 20261104; no production data is ever loaded.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T01 | unit | PS-139-01.R01, PS-139-01.R02, PS-139-08.R02 | generate a report from a recorded run | schema valid; environment fields and scraped metrics present |
| TEST-PS-139-09.T02 | unit | PS-139-01.R03 | seed twice with seed 20261104 | identical dataset hashes |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [module SPEC](SPEC.md).
