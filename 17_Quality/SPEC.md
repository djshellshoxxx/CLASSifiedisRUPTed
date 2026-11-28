# F17 — Quality engineering

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `quality`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F17.S01 01_testing](01_testing/SPEC.md) — 4 modules
- [F17.S02 02_performance](02_performance/SPEC.md) — 3 modules
- [F17.S03 03_release](03_release/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F17` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F02, F04, F06, F07, F08, F09, F10, F11, F12, F14, F15, F16, F18.

### Cross-subfeature and external events

_None._
