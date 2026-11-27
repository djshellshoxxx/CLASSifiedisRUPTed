# F19.S02 — 02_local_matching

**Status:** SPECIFIED. **Parent:** [F19](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F19.S02.M01 | [Bounded local matching](mod_matcher/SPEC.md) | SPECIFIED | Experimental deterministic matching of private criteria against an authenticated local public-candidate snapshot; bounded minimal references, current session and intent guards, no remote confidential provider or automatic disclosure. |

## Aggregation

Modules in this subfeature share the feature package `packages/blindmatch` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
