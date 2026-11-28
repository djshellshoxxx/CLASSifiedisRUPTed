# F15.S04 — 04_configuration

**Status:** SPECIFIED. **Parent:** [F15](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F15.S04.M01 | [Feature registry](mod_feature/SPEC.md) | SPECIFIED | Static registry of features/modules and their depends_on graph (generated from modules.yaml), cycle-free validation. |
| F15.S04.M02 | [Feature flags](mod_flags/SPEC.md) | SPECIFIED | Per-tenant flag values, evaluation with dependency rule (CTR-FLG-001), cache ≤ 30 s. |
| F15.S04.M03 | [Tenants](mod_tenants/SPEC.md) | SPECIFIED | Tenant bootstrap, settings (allowed currencies, jurisdiction profile, default locale, limits), operator assignment. |

## Aggregation

Modules in this subfeature share the feature package `packages/platform` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| platform.tenant.created | F15.S04.M03 | F15.S04.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F15.S04.M02 | external |
| security.role.assigned | F16.S01.M01 | F15.S04.M03 | external |
| security.role.revoked | F16.S01.M01 | F15.S04.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F15.S04.M03 | external |
