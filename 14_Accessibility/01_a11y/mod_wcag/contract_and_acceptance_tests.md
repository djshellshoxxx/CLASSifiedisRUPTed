# PS-111-09 — Contract and acceptance tests: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-09.R01** Every requirement of this module is covered by at least one automated test or documented manual pass.
- **PS-111-09.R02** The gate itself is tested with seeded broken fixtures that must fail it, proving it detects what it claims to.
- **PS-111-09.R03** Manual criteria are recorded per release with device, date and owner.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture app routes with intentionally failing variants (low contrast chip, missing label, 40 px button, obscured focus, drag-only reorder, passphrase field that cancels paste, passphrase field with autocomplete=off, recovery screen with typing only); token set with one failing pair; waiver files valid, expired, without target and with two targets, including a lint waiver on a component path; routes.yaml with a static route excluding four states with reasons and one exclusion without reviewer; all fixtures generated from seeds in the repository.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-02.R02, PS-111-01.R04 | add a route without tests; remove one applicable state test; exclude a state without reviewer; exclude four states with reasons and reviewer on a static route | I18N_A11Y_ROUTE_UNCOVERED naming route and state for the first three; the reviewed exclusions pass without waivers |
| TEST-PS-111-09.T03 | unit | PS-111-02.R03 | token pairs at 4.49:1, 4.5:1, 2.99:1 and 3:1 in all themes including semi-transparent tokens | failures below thresholds only; blended backgrounds evaluated |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, no target, two targets, a valid route waiver and a valid lint waiver on a component path read by the F14.S01.M01 lint runner | I18N_A11Y_WAIVER_INVALID for the first five; the route waiver suppresses only its rule and route; the component waiver suppresses only its lint rule on that component; 14-day warning emitted |
| TEST-PS-111-09.T05 | integration | PS-111-03.R01, PS-111-03.R02, PS-111-03.R04 | create a release candidate with an incomplete checklist, then with a complete checklist but no full-matrix run on its commit | tagging blocked with I18N_A11Y_CHECKLIST_INCOMPLETE until all criteria have result, date, device, owner, and blocked until the full matrix passes on that commit |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |
| TEST-PS-111-09.T07 | integration | PS-111-04.R01, PS-111-04.R02, PS-111-04.R03, PS-111-01.R02 | run each CLI task and validate report.json against tests/a11y/report.schema.json | exit codes and stable error codes present; every finding has route, state, theme, viewport, locale, rule id, impact, selector and WCAG success criterion; a report missing any of the nine fields fails schema validation; no app commands or events |
| TEST-PS-111-09.T08 | abuse | PS-111-05.R01, PS-111-05.R02, PS-111-07.R01, PS-111-07.R03 | PR that edits waivers.yaml, the excluded states of routes.yaml or disables an axe rule with one reviewer | CI requires two CODEOWNERS approvals; rule disabling in config rejected |
| TEST-PS-111-09.T09 | chaos | PS-111-06.R01, PS-111-06.R02, PS-111-06.R03 | kill one Playwright shard; inject a flaky navigation timeout | run marked failed listing missing combinations; flaky retry reported, real findings not hidden |
| TEST-PS-111-09.T10 | unit | PS-111-06.R01, PS-111-07.R01, PS-111-07.R02, PS-111-05.R03 | run twice on the same commit; scan reports for page text or user data; regenerate fixtures from their seeds | identical findings; reports contain selectors and rule ids only; regenerated fixtures are byte-identical to the committed ones and contain only synthetic data |
| TEST-PS-111-09.T11 | manual | PS-111-09.R03 | release pass on Pixel 7 and iPhone 14 for 2.4.11, 2.5.7, 2.5.8, 3.3.7, 3.3.8, 3.2.6, 1.4.10, 1.4.12 | each criterion recorded pass with owner, date, device; 3.3.8 confirms on vault unlock, recovery-kit restore and backup passphrase screens that a password manager fills the passphrase, paste works, show/hide works and the kit imports by file and by QR |
| TEST-PS-111-09.T12 | load | PS-111-08.R01, PS-111-08.R02, PS-111-08.R03 | pull-request subset and nightly full matrix on the CI runner with the 60-route fixture | subset ≤ 15 min, full ≤ 60 min, contrast ≤ 10 s, trend artifact published |
| TEST-PS-111-09.T13 | unit | PS-111-09.R01, PS-111-09.R02 | traceability tool run | every PS-111 requirement maps to a passing test or recorded manual pass |
| TEST-PS-111-09.T14 | integration | PS-111-10.R01, PS-111-10.R02, PS-111-10.R03 | generate accessibility statement draft; upgrade axe-core minor version | draft lists results and waivers; new findings from the upgrade listed before the pin changes |
| TEST-PS-111-09.T15 | integration | PS-111-02.R04, PS-111-02.R03 | run pnpm a11y:auth on the vault unlock, recovery-kit restore and backup passphrase screens and on the fixtures with a paste-cancelling field, autocomplete=off and a typing-only recovery screen | real screens pass; each fixture fails with I18N_A11Y_AUTH_ASSIST naming route and selector |

## Acceptance criteria

- All automated tests pass in CI; manual test T11 is recorded as passed in the release checklist (V05), together with F14.S01.M01 T14 and F14.S01.M02 T11.
- Zero serious or critical axe violations across all routes, applicable states, themes and viewports in the full matrix of the release commit.
- Every colour token pair meets the contrast thresholds in all themes.

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
