# PS-109-09 — Contract and acceptance tests: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-109-09.R02** Keyboard-only Playwright flows cover the core journeys on the Pixel 7 and iPhone 14 profiles with an external keyboard emulation.
- **PS-109-09.R03** Lint rules have positive and negative fixtures proving they fail and pass correctly.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture app with sticky header 56 px and bottom nav 64 px, dialog stack of 2, photo reorder list of 5, canvas map with list alternative; lint fixtures for each rule.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T01 | unit | PS-109-01.R01, PS-109-01.R02, PS-109-02.R01 | compute tokens and lint templates with tabindex 3, div onclick, button 40 px high | V01, V02, V03 codes raised; compliant fixtures pass |
| TEST-PS-109-09.T02 | e2e | PS-109-01.R03, PS-109-03.R01 | keyboard-only: tab through the listing form, open and close dialogs, change route | all controls reachable, focus order logical, focus on heading after route change within 100 ms |
| TEST-PS-109-09.T03 | e2e | PS-109-01.R03, PS-109-03.R02, PS-109-06.R03 | nested dialogs close in sequence; trigger removed while dialog open | focus restored to triggers in order; fallback to nearest focusable ancestor |
| TEST-PS-109-09.T04 | e2e | PS-109-01.R03, PS-109-02.R02 | reorder 5 photos using only buttons and then with pointer drag | identical results; V04 fixture without buttons fails |
| TEST-PS-109-09.T05 | e2e | PS-109-01.R01, PS-109-01.R02, PS-109-02.R03 | focus each control with sticky header and bottom nav at 320 px width and 200 percent zoom | element never fully covered (V06); target sizes ≥ 44 px |
| TEST-PS-109-09.T06 | unit | PS-109-02.R02, PS-109-02.R03 | register single-character shortcut without modifier | V07 raised; with modifier or off switch passes |
| TEST-PS-109-09.T07 | unit | PS-109-03.R01, PS-109-03.R02, PS-109-03.R03 | open and close dialogs rapidly in random order (property test, 200 runs) | stack consistent; inert state cleared; focus restored |
| TEST-PS-109-09.T08 | unit | PS-109-04.R01, PS-109-04.R02, PS-109-04.R03, PS-109-05.R01, PS-109-05.R02, PS-109-05.R03 | inspect module exports, DOM events and network calls | no domain events, no vault or network access, errors are lint codes |
| TEST-PS-109-09.T09 | unit | PS-109-06.R01, PS-109-06.R02, PS-109-06.R03 | call route focus twice; missing target; dialog render error | idempotent; fallback order followed; page not left inert |
| TEST-PS-109-09.T10 | abuse | PS-109-07.R01, PS-109-07.R02, PS-109-07.R03 | log capture while typing a password and injecting content that calls focus() | key values never logged; injected focus calls do not move focus without user action |
| TEST-PS-109-09.T11 | a11y | PS-109-01.R03, PS-109-07.R03 | axe on pages using each primitive in light, dark and forced colors | zero serious or critical findings |
| TEST-PS-109-09.T12 | load | PS-109-08.R01, PS-109-08.R02, PS-109-08.R03 | measure focus move, dialog open, suite duration and bundle size | ≤ 100 ms, ≤ 100 ms, ≤ 5 min and ≤ 6 KiB gzip |
| TEST-PS-109-09.T13 | unit | PS-109-09.R01, PS-109-09.R03 | traceability tool run | every PS-109 requirement maps to a passing test |
| TEST-PS-109-09.T14 | manual | PS-109-09.R02, PS-109-10.R01 | 20-minute keyboard and screen reader session on a physical Pixel 7 and iPhone 14 | checklist 2.4.11, 2.5.7, 2.5.8 completed with no blockers |
| TEST-PS-109-09.T15 | unit | PS-109-10.R02, PS-109-10.R03 | upgrade token file from v1 to v1.1 and roll back | components render with defaults; no consumer breaks |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- Every core journey is completable with the keyboard only on the two mobile profiles with an external keyboard.
- No interactive element is smaller than 44 by 44 CSS px except documented inline links.

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
