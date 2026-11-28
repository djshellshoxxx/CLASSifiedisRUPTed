# PS-109-01 — Domain schema: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-01.R01** The module owns no stored entity; its artifacts are CSS tokens, TypeScript primitives and lint rules versioned with the PWA.
- **PS-109-01.R02** Design tokens define --focus-ring-width 2px, --focus-ring-offset 2px, --target-min 44px and --scroll-pad-top and --scroll-pad-bottom computed from the heights of sticky bars.
- **PS-109-01.R03** Primitive components expose a documented keyboard contract (keys and expected behaviour) that tests assert.

## Specification

**Note:** UI library and tooling; it stores no data and owns no catalog entity. Preference values such as motion (system | reduced) arrive as parameters from the PWA shell, which reads them from F15.S04.M03 LocalSettings.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T01 | unit | PS-109-01.R01, PS-109-01.R02, PS-109-02.R01 | compute tokens and lint templates with tabindex 3, div onclick, a button primitive with a fixed 40 px height | V01, V02, V03 codes raised; compliant fixtures pass |
| TEST-PS-109-09.T02 | e2e | PS-109-01.R03, PS-109-03.R01 | keyboard-only: tab through the listing form, open and close dialogs, change route | all controls reachable, focus order logical, focus on heading after route change within 100 ms |
| TEST-PS-109-09.T03 | e2e | PS-109-01.R03, PS-109-03.R02, PS-109-06.R03 | nested dialogs close in sequence; trigger removed while dialog open | focus restored to triggers in order; fallback to nearest focusable ancestor |
| TEST-PS-109-09.T04 | e2e | PS-109-01.R03 | reorder 5 photos using only buttons and then with pointer drag | identical results; V04 fixture without buttons fails |
| TEST-PS-109-09.T05 | e2e | PS-109-01.R02, PS-109-02.R01 | focus each control with sticky header and bottom nav at 320 px width and 200 percent zoom, measuring getBoundingClientRect | element never fully covered (V06); every measured hit area ≥ 44 by 44 CSS px except inline links (V08) |
| TEST-PS-109-09.T11 | a11y | PS-109-01.R03 | axe on pages using each primitive in light, dark and forced colors | zero serious or critical findings |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
