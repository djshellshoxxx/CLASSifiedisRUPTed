# PS-111-02 — Validation rules: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-02.R01** CI fails on any serious or critical axe violation that has no valid waiver.
- **PS-111-02.R02** CI fails on contrast failures, missing route coverage, expired waivers and incomplete manual checklist at release time.
- **PS-111-02.R03** Each failure has one stable code printed in CI output.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | zero serious or critical axe-core violations per route, state, theme and viewport after waivers | I18N_A11Y_AXE_VIOLATION |
| V02 | every route in the route registry appears in routes.yaml with tests for all six states | I18N_A11Y_ROUTE_UNCOVERED |
| V03 | text token pairs reach 4.5:1 (3:1 for large text), UI component, focus ring and graphic pairs reach 3:1, in light, dark and forced-colors themes | I18N_A11Y_CONTRAST |
| V04 | each waiver has rule, route, reason, owner and expiry within 90 days of creation and is not expired | I18N_A11Y_WAIVER_INVALID |
| V05 | the release checklist has a passed result with date, device and owner for every manual criterion | I18N_A11Y_CHECKLIST_INCOMPLETE |
| V06 | no horizontal scroll at 320 CSS px width and 400 percent zoom equivalent, and text spacing overrides do not clip content | I18N_A11Y_REFLOW |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-01.R02, PS-111-02.R02 | add a route without tests; remove one state test | I18N_A11Y_ROUTE_UNCOVERED naming route and state |
| TEST-PS-111-09.T03 | unit | PS-111-01.R03, PS-111-02.R03 | token pairs at 4.49:1, 4.5:1, 2.99:1 and 3:1 in all themes including semi-transparent tokens | failures below thresholds only; blended backgrounds evaluated |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, valid | I18N_A11Y_WAIVER_INVALID for the first three; valid waiver suppresses only its rule and route; 14-day warning emitted |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
