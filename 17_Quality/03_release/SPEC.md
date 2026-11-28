# F17.S03 — 03_release

**Status:** SPECIFIED. **Parent:** [F17](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F17.S03.M01 | [Continuous integration](mod_ci/SPEC.md) | SPECIFIED | Fast Linux gate: install (cached store), spec:check, typecheck, unit/property/integration, build PWA, e2e smoke; concurrency cancel; paths-ignore docs. |
| F17.S03.M02 | [Release gates](mod_gates/SPEC.md) | SPECIFIED | Release checklist automation: traceability coverage, no critical vulns (npm audit), a11y zero serious, budgets, changelog. |
| F17.S03.M03 | [Compatibility](mod_compatibility/SPEC.md) | SPECIFIED | Schema N-1 compatibility tests, browser support matrix (last 2 Chrome/Firefox/Safari, iOS 16.4+ for push), API versioning checks. |

## Aggregation

Modules in this subfeature share the feature package `packages/quality` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
