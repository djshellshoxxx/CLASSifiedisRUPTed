# PS-138-01 — Domain schema: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-01.R01** The module owns no persisted entities; faults are described in a scenario file (YAML) and results in reports/chaos.json.
- **PS-138-01.R02** A scenario lists fault type, injection point, duration, seed, and the invariants to assert; the schema is validated before the run.
- **PS-138-01.R03** Fault injectors wrap ports and the clock in the test relay; production code contains no chaos hooks and a build check proves it.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T01 | unit | PS-138-01.R01, PS-138-01.R02, PS-138-02.R03 | validate a scenario file without seed or recovery | rejected with QUALITY_CHAOS_SCENARIO_INVALID |
| TEST-PS-138-09.T02 | integration | PS-138-01.R03, PS-138-02.R02, PS-138-04.R03 | scan production bundles and run with out-of-bound parameters | no chaos hooks; QUALITY_CHAOS_SCENARIO_INVALID for 31 s BUSY and 25 h skew |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [module SPEC](SPEC.md).
