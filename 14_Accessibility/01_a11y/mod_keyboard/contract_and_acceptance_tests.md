# PS-109-09 — Contract and acceptance tests: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-09.R01** Every requirement of this module is covered by at least one automated test, except 09.R04, which is the manual device-session requirement itself and is covered by the recorded manual test.
- **PS-109-09.R02** Keyboard-only Playwright flows cover the core journeys on the Pixel 7 and iPhone 14 profiles with an external keyboard emulation.
- **PS-109-09.R03** Lint rules have positive and negative fixtures proving they fail and pass correctly.
- **PS-109-09.R04** A manual keyboard session on physical Pixel 7 and iPhone 14 devices supplements the automated tests and is recorded per release, with device, date and owner, in the F14.S01.M03 release checklist (V05).

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture app with sticky header 56 px and bottom nav 64 px, dialog stack of 2, photo reorder list of 5, canvas map with list alternative; lint fixtures for each rule; a waiver file with valid, expired and missing entries targeting component paths; a received listing whose description contains '<input autofocus>' and '<script>document.querySelector("button").focus()</script>'; LocalSettings fixtures with a11yMotion system, reduced and an invalid value.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T01 | unit | PS-109-01.R01, PS-109-01.R02, PS-109-02.R01 | compute tokens and lint templates with tabindex 3, div onclick, a button primitive with a fixed 40 px height | V01, V02, V03 codes raised; compliant fixtures pass |
| TEST-PS-109-09.T02 | e2e | PS-109-01.R03, PS-109-03.R01 | keyboard-only: tab through the listing form, open and close dialogs, change route | all controls reachable, focus order logical, focus on heading after route change within 100 ms |
| TEST-PS-109-09.T03 | e2e | PS-109-01.R03, PS-109-03.R02, PS-109-06.R03 | nested dialogs close in sequence; trigger removed while dialog open | focus restored to triggers in order; fallback to nearest focusable ancestor |
| TEST-PS-109-09.T04 | e2e | PS-109-01.R03 | reorder 5 photos using only buttons and then with pointer drag | identical results; V04 fixture without buttons fails |
| TEST-PS-109-09.T05 | e2e | PS-109-01.R02, PS-109-02.R01 | focus each control with sticky header and bottom nav at 320 px width and 200 percent zoom, measuring getBoundingClientRect | element never fully covered (V06); every measured hit area ≥ 44 by 44 CSS px except inline links (V08) |
| TEST-PS-109-09.T06 | unit | PS-109-02.R01 | register single-character shortcut without modifier | V07 raised; with modifier or off switch passes |
| TEST-PS-109-09.T07 | unit | PS-109-03.R01, PS-109-03.R02, PS-109-03.R03 | open and close dialogs rapidly in random order (property test, 200 runs) | stack consistent; inert state cleared; focus restored |
| TEST-PS-109-09.T08 | unit | PS-109-04.R01, PS-109-04.R02, PS-109-04.R03, PS-109-05.R01, PS-109-05.R02 | inspect module exports, DOM events, storage and network calls | no domain events, no vault, IndexedDB or network access, preference only via setMotionPreference parameter, errors are lint codes |
| TEST-PS-109-09.T09 | unit | PS-109-06.R01, PS-109-06.R02, PS-109-06.R03 | call route focus twice; missing target; dialog render error | idempotent; fallback order followed; page not left inert |
| TEST-PS-109-09.T10 | abuse | PS-109-07.R01, PS-109-07.R02, PS-109-07.R03, PS-109-07.R04 | log and network capture while typing a password; render a received listing description containing '<input autofocus>' and an inline script calling focus() | key values never logged; no request leaves the page; markup shown as text; no autofocus, tabindex or on* attribute in the DOM; focus does not move; a securitypolicyviolation event shows the script blocked by CSP |
| TEST-PS-109-09.T11 | a11y | PS-109-01.R03 | axe on pages using each primitive in light, dark and forced colors | zero serious or critical findings |
| TEST-PS-109-09.T12 | load | PS-109-08.R01, PS-109-08.R02, PS-109-08.R03 | measure focus move, dialog open, suite duration and bundle size | ≤ 100 ms, ≤ 100 ms, ≤ 5 min and ≤ 6 KiB gzip |
| TEST-PS-109-09.T13 | unit | PS-109-09.R01, PS-109-09.R03 | traceability tool run | every PS-109 requirement maps to a passing test |
| TEST-PS-109-09.T14 | manual | PS-109-09.R04 | 20-minute keyboard session on a physical Pixel 7 and iPhone 14 with a hardware keyboard | checklist items 2.4.11, 2.5.7 and 2.5.8 completed with no blockers and recorded with device, date and owner in the F14.S01.M03 release checklist |
| TEST-PS-109-09.T15 | unit | PS-109-10.R03 | upgrade token file from v1 to v1.1 and roll back | components render with defaults; no consumer breaks |
| TEST-PS-109-09.T16 | integration | PS-109-02.R02 | trigger each rule V01–V08 in the lint runner, the e2e suite and the development build overlay | each failure prints its stable code in CI output, and the overlay marks the element with the same code |
| TEST-PS-109-09.T17 | unit | PS-109-02.R03 | V02 violation in a component path with a valid component-target waiver, with an expired waiver and with no waiver | passes only with the valid waiver; expired or missing waiver fails with the original rule code; the runner reads tests/a11y/waivers.yaml |
| TEST-PS-109-09.T18 | unit | PS-109-05.R03 | build the production bundle and search it for the overlay module and its strings | no overlay code or strings in the production bundle; the development build contains them |
| TEST-PS-109-09.T19 | e2e | PS-109-09.R02 | Playwright keyboard-only run of browse, create listing, make offer and open thread on the Pixel 7 and iPhone 14 profiles with keyboard emulation | every journey completes without a pointer, no trap, focus visible at every step |
| TEST-PS-109-09.T20 | integration | PS-109-10.R01, PS-109-10.R02 | vault export and import round trip through F15.S04.M03 with a11yMotion reduced, then with an invalid value | export holds nothing from this module; reduced survives and the shell passes it to setMotionPreference; invalid value falls back to system |

## Acceptance criteria

- All automated tests pass in CI; manual test T14 is recorded as passed in the release checklist (F14.S01.M03 V05).
- Every core journey is completable with the keyboard only on the two mobile profiles with an external keyboard.
- No interactive element is smaller than 44 by 44 CSS px except documented inline links.

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
