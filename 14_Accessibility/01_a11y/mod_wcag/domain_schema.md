# PS-111-01 — Domain schema: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-01.R01** The module owns no stored entity; its artifacts are route inventory, waiver file, checklist and report in the repository.
- **PS-111-01.R02** The report schema lists for each run the route, state, theme, viewport, locale, rule id, impact, selector and WCAG success criterion, and report.json is validated against the JSON Schema tests/a11y/report.schema.json that requires all nine fields.
- **PS-111-01.R03** Waivers are structured data with an expiry, cannot be open-ended, and each names exactly one target (a route, a file glob or a component), so route-level axe findings and the file- or component-level lint findings of F14.S01.M01 and F14.S01.M02 are waived through the same file.
- **PS-111-01.R04** routes.yaml lists for every route its applicable UX states (by default all six of CTR-UX-001 UX-2) and, for each excluded state, a reason and the reviewer who approved the exclusion; waivers are for rule failures only, never for states a route does not have.

## Specification

**Note:** CI tooling; it stores no application data and owns no catalog entity. Waiver row: { rule, target: { route } | { glob } | { component }, reason, owner, created, expires }. Route row: { route, states: [..], excluded: [{ state, reason, reviewer }] }.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-02.R02, PS-111-01.R04 | add a route without tests; remove one applicable state test; exclude a state without reviewer; exclude four states with reasons and reviewer on a static route | I18N_A11Y_ROUTE_UNCOVERED naming route and state for the first three; the reviewed exclusions pass without waivers |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, no target, two targets, a valid route waiver and a valid lint waiver on a component path read by the F14.S01.M01 lint runner | I18N_A11Y_WAIVER_INVALID for the first five; the route waiver suppresses only its rule and route; the component waiver suppresses only its lint rule on that component; 14-day warning emitted |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |
| TEST-PS-111-09.T07 | integration | PS-111-04.R01, PS-111-04.R02, PS-111-04.R03, PS-111-01.R02 | run each CLI task and validate report.json against tests/a11y/report.schema.json | exit codes and stable error codes present; every finding has route, state, theme, viewport, locale, rule id, impact, selector and WCAG success criterion; a report missing any of the nine fields fails schema validation; no app commands or events |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [module SPEC](SPEC.md).
