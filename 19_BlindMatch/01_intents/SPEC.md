# F19.S01 — 01_intents

**Status:** SPECIFIED. **Parent:** [F19](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F19.S01.M01 | [Private local intents](mod_local/SPEC.md) | SPECIFIED | Experimental owner-only intent CRUD and strict local erasure through encrypted vault storage; revisions, expiry, session guards and inactive recovery; no public projection or retained deletion history. |

## Aggregation

Modules in this subfeature share the feature package `packages/blindmatch` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
