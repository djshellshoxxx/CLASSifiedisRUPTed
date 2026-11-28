# F14.S01 — 01_a11y

**Status:** SPECIFIED. **Parent:** [F14](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F14.S01.M01 | [Keyboard operability](mod_keyboard/SPEC.md) | SPECIFIED | All interactions keyboard-operable, visible focus, skip link, focus management on route change and dialogs, no traps. |
| F14.S01.M02 | [Screen reader support](mod_screenreader/SPEC.md) | SPECIFIED | Semantic landmarks, labels, live regions for async state, accessible names for money/distance values. |
| F14.S01.M03 | [WCAG 2.2 AA conformance](mod_wcag/SPEC.md) | SPECIFIED | axe-core automated checks per screen in CI, manual checklist for criteria not automatable, contrast tokens ≥ 4.5:1. |

## Aggregation

Modules in this subfeature share the feature package `packages/i18n` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
