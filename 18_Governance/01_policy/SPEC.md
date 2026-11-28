# F18.S01 — 01_policy

**Status:** SPECIFIED. **Parent:** [F18](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F18.S01.M01 | [Jurisdiction profiles](mod_jurisdictions/SPEC.md) | SPECIFIED | Configurable profiles (retention overrides, age gates, required notices, restricted categories) — configuration, not legal advice. |
| F18.S01.M02 | [Prohibited items](mod_prohibited/SPEC.md) | SPECIFIED | Prohibited categories/keywords rule set evaluated at publish (block or review), versioned, per jurisdiction. |
| F18.S01.M03 | [Goods taxonomy](mod_goods/SPEC.md) | SPECIFIED | Hierarchical category taxonomy (max depth 4) with stable IDs, localized names, restricted flags. |

## Aggregation

Modules in this subfeature share the feature package `packages/governance` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| governance.category.changed | F18.S01.M03 | F18.S01.M01 | internal |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M01 | external |
| governance.category.changed | F18.S01.M03 | F18.S01.M02 | internal |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M02 | external |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M03 | external |
