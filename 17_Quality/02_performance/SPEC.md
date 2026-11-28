# F17.S02 — 02_performance

**Status:** SPECIFIED. **Parent:** [F17](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F17.S02.M01 | [Load testing](mod_load/SPEC.md) | SPECIFIED | Node load script for read/write/search/matching budgets (CTR-OBS-001 OBS-4) with report. |
| F17.S02.M02 | [Chaos testing](mod_chaos/SPEC.md) | SPECIFIED | Fault injection: DB busy, consumer crash, duplicate delivery, clock skew, peer outage; invariants hold. |
| F17.S02.M03 | [Offline testing](mod_offline/SPEC.md) | SPECIFIED | Outbox replay, conflict prompts, cache behavior under offline/flaky network. |

## Aggregation

Modules in this subfeature share the feature package `packages/quality` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
