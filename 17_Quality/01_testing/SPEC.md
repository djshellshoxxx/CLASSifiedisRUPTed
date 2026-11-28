# F17.S01 — 01_testing

**Status:** SPECIFIED. **Parent:** [F17](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F17.S01.M01 | [Unit testing](mod_unit/SPEC.md) | SPECIFIED | vitest config, conventions, coverage thresholds (core packages ≥ 85 % lines), deterministic fixtures. |
| F17.S01.M02 | [Property testing](mod_property/SPEC.md) | SPECIFIED | fast-check suites for money, matching, state machines, geohash, idempotency; seeds; nightly high-run profile. |
| F17.S01.M03 | [Integration testing](mod_integration/SPEC.md) | SPECIFIED | Relay + SQLite in-memory end-to-end command flows for the 12 reference flows; contract tests for events. |
| F17.S01.M04 | [E2E testing](mod_e2e/SPEC.md) | SPECIFIED | Playwright mobile profiles against built PWA + relay; offline/reconnect; axe checks. |

## Aggregation

Modules in this subfeature share the feature package `packages/quality` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
