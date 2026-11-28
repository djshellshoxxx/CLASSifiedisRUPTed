# F15 — Platform operations

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `platform`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F15.S01 01_pwa](01_pwa/SPEC.md) — 3 modules
- [F15.S02 02_backend](02_backend/SPEC.md) — 3 modules
- [F15.S03 03_operations](03_operations/SPEC.md) — 3 modules
- [F15.S04 04_configuration](04_configuration/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F15` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F10, F11, F14, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| privacy.deletion.completed | F10.S01.M04 | F15.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F15.S04.M02 | external |
| security.role.assigned | F16.S01.M01 | F15.S04.M03 | external |
| security.role.revoked | F16.S01.M01 | F15.S04.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F15.S04.M03 | external |
