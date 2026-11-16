# PS-141-01 — Domain schema: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-01.R01** The module owns no persisted entities; its files are workflow YAML under .github/workflows and a lint script tools/ci-lint.
- **PS-141-01.R02** Workflow artifacts are named pwa-dist, reports-fast and reports-nightly with defined retention: 7, 14 and 30 days.
- **PS-141-01.R03** Environment pins are declared once as env at workflow level: NODE_VERSION 22, PNPM_VERSION 10.28.0, with actions pinned to a full commit SHA or an exact major tag.

## Specification

**Note:** Tooling module: owns no persisted entities. Its outputs are test configuration, source files under the code path and CI artifacts (JSON/JUnit/LCOV reports) that are regenerated on every run and never stored by the relay.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T01 | unit | PS-141-01.R01, PS-141-01.R02, PS-141-01.R03 | lint good workflow fixtures and check artifact names, retention and env pins | all accepted; names and pins verified |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [module SPEC](SPEC.md).
