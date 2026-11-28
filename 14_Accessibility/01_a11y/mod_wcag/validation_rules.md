# PS-111-02 — Validation rules: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-02.R01** CI fails on any serious or critical axe violation that has no valid waiver.
- **PS-111-02.R02** CI fails on contrast failures, missing route coverage, expired waivers and incomplete manual checklist at release time.
- **PS-111-02.R03** Each failure has one stable code printed in CI output.
- **PS-111-02.R04** CI fails when a passphrase or recovery input on the vault unlock, recovery-kit restore or backup passphrase screens lacks the correct autocomplete value, blocks paste, drop or password-manager autofill, has no show/hide toggle, or when recovery offers transcription as the only path.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | zero serious or critical axe-core violations per route, applicable state, theme and viewport after waivers | I18N_A11Y_AXE_VIOLATION |
| V02 | every route in the route registry appears in routes.yaml with its applicable states, every applicable state has a test, and every excluded state has a reason and a reviewer | I18N_A11Y_ROUTE_UNCOVERED |
| V03 | text token pairs reach 4.5:1 (3:1 for large text), UI component, focus ring and graphic pairs reach 3:1, in light, dark and forced-colors themes | I18N_A11Y_CONTRAST |
| V04 | each waiver has rule, exactly one target (route, file glob or component), reason, owner and expiry within 90 days of creation and is not expired | I18N_A11Y_WAIVER_INVALID |
| V05 | the release checklist has a passed result with date, device and owner for every manual criterion and every recorded manual test of F14 | I18N_A11Y_CHECKLIST_INCOMPLETE |
| V06 | no horizontal scroll at 320 CSS px width and 400 percent zoom equivalent, and text spacing overrides do not clip content | I18N_A11Y_REFLOW |
| V07 | on the vault unlock, recovery-kit restore and backup export and import screens, passphrase inputs carry autocomplete current-password (existing secret) or new-password (new secret), no handler cancels paste, drop or input events, a show/hide toggle exists, and the recovery-kit restore screen accepts the kit by file chooser or QR scan and the 24 words by pasting the whole phrase, in addition to typing | I18N_A11Y_AUTH_ASSIST |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-02.R02, PS-111-01.R04 | add a route without tests; remove one applicable state test; exclude a state without reviewer; exclude four states with reasons and reviewer on a static route | I18N_A11Y_ROUTE_UNCOVERED naming route and state for the first three; the reviewed exclusions pass without waivers |
| TEST-PS-111-09.T03 | unit | PS-111-02.R03 | token pairs at 4.49:1, 4.5:1, 2.99:1 and 3:1 in all themes including semi-transparent tokens | failures below thresholds only; blended backgrounds evaluated |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, no target, two targets, a valid route waiver and a valid lint waiver on a component path read by the F14.S01.M01 lint runner | I18N_A11Y_WAIVER_INVALID for the first five; the route waiver suppresses only its rule and route; the component waiver suppresses only its lint rule on that component; 14-day warning emitted |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |
| TEST-PS-111-09.T15 | integration | PS-111-02.R04, PS-111-02.R03 | run pnpm a11y:auth on the vault unlock, recovery-kit restore and backup passphrase screens and on the fixtures with a paste-cancelling field, autocomplete=off and a typing-only recovery screen | real screens pass; each fixture fails with I18N_A11Y_AUTH_ASSIST naming route and selector |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
