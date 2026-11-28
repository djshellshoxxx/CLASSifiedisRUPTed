# PS-109-02 — Validation rules: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-02.R01** Build-time lint and unit checks, plus end-to-end measurements for properties that exist only after the CSS cascade (computed hit area and obscured focus), reject patterns that make keyboard or single-pointer operation impossible.
- **PS-109-02.R02** Each rule failure has one stable code that appears in CI output and in the developer overlay.
- **PS-109-02.R03** Rules are enforced on every pull request and cannot be waived without an expiring entry in tests/a11y/waivers.yaml (schema owned by F14.S01.M03) whose single target is the file glob or component that fails; the lint runner of this module reads that same file.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | no tabindex greater than 0 in any template or component | I18N_A11Y_TABINDEX_POSITIVE |
| V02 | click or pointer handlers are attached only to native interactive elements or elements with a role and key handlers | I18N_A11Y_NON_INTERACTIVE_HANDLER |
| V03 | lint: interactive primitives set min-inline-size and min-block-size from var(--target-min) and do not override them with smaller fixed sizes, except inline text links in running text | I18N_A11Y_TARGET_SIZE |
| V04 | every drag, swipe or pointer-path interaction has a single-pointer or button alternative | I18N_A11Y_NO_DRAG_ALTERNATIVE |
| V05 | focus can leave every component with Tab, Shift+Tab or Escape (no trap), except modal dialogs that close with Escape | I18N_A11Y_KEYBOARD_TRAP |
| V06 | the focused element's bounding box is not fully covered by a sticky or fixed element after scrolling into view | I18N_A11Y_FOCUS_OBSCURED |
| V07 | no single-character keyboard shortcut is registered without an off switch or modifier key | I18N_A11Y_SINGLE_KEY_SHORTCUT |
| V08 | end-to-end: getBoundingClientRect of every interactive element measures at least 44 by 44 CSS px at 320 px width and at 200 percent zoom, except inline text links in running text | I18N_A11Y_TARGET_SIZE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T01 | unit | PS-109-01.R01, PS-109-01.R02, PS-109-02.R01 | compute tokens and lint templates with tabindex 3, div onclick, a button primitive with a fixed 40 px height | V01, V02, V03 codes raised; compliant fixtures pass |
| TEST-PS-109-09.T05 | e2e | PS-109-01.R02, PS-109-02.R01 | focus each control with sticky header and bottom nav at 320 px width and 200 percent zoom, measuring getBoundingClientRect | element never fully covered (V06); every measured hit area ≥ 44 by 44 CSS px except inline links (V08) |
| TEST-PS-109-09.T06 | unit | PS-109-02.R01 | register single-character shortcut without modifier | V07 raised; with modifier or off switch passes |
| TEST-PS-109-09.T16 | integration | PS-109-02.R02 | trigger each rule V01–V08 in the lint runner, the e2e suite and the development build overlay | each failure prints its stable code in CI output, and the overlay marks the element with the same code |
| TEST-PS-109-09.T17 | unit | PS-109-02.R03 | V02 violation in a component path with a valid component-target waiver, with an expired waiver and with no waiver | passes only with the valid waiver; expired or missing waiver fails with the original rule code; the runner reads tests/a11y/waivers.yaml |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
