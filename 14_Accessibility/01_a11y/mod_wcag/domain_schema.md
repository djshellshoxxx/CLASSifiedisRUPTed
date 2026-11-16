# PS-111-01 — Domain schema: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-01.R01** The module owns no stored entity; its artifacts are route inventory, waiver file, checklist and report in the repository.
- **PS-111-01.R02** The report schema lists for each run the route, state, theme, viewport, locale, rule id, impact, selector and WCAG success criterion.
- **PS-111-01.R03** Waivers are structured data with an expiry and cannot be open-ended.

## Specification

**Note:** CI tooling; it stores no application data and owns no catalog entity.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-01.R02, PS-111-02.R02 | add a route without tests; remove one state test | I18N_A11Y_ROUTE_UNCOVERED naming route and state |
| TEST-PS-111-09.T03 | unit | PS-111-01.R03, PS-111-02.R03 | token pairs at 4.49:1, 4.5:1, 2.99:1 and 3:1 in all themes including semi-transparent tokens | failures below thresholds only; blended backgrounds evaluated |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, valid | I18N_A11Y_WAIVER_INVALID for the first three; valid waiver suppresses only its rule and route; 14-day warning emitted |
| TEST-PS-111-09.T05 | integration | PS-111-03.R01, PS-111-03.R02, PS-111-01.R02 | create a release candidate with an incomplete checklist | tagging blocked with I18N_A11Y_CHECKLIST_INCOMPLETE until all criteria have result, date, device, owner |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |
| TEST-PS-111-09.T11 | manual | PS-111-01.R02, PS-111-09.R03 | release pass on Pixel 7 and iPhone 14 for 2.4.11, 2.5.7, 2.5.8, 3.3.7, 3.3.8, 3.2.6, 1.4.10, 1.4.12 | each criterion recorded pass with owner, date, device; 3.3.8 confirms no cognitive function test |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
