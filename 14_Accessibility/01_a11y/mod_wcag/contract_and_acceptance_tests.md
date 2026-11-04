# PS-111-09 — Contract and acceptance tests: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-09.R01** Every requirement of this module is covered by at least one automated test or documented manual pass.
- **PS-111-09.R02** The gate itself is tested with seeded broken fixtures that must fail it, proving it detects what it claims to.
- **PS-111-09.R03** Manual criteria are recorded per release with device, date and owner.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture app routes with intentionally failing variants (low contrast chip, missing label, 40 px button, obscured focus, drag-only reorder); token set with one failing pair; waiver files valid and expired.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T01 | integration | PS-111-01.R01, PS-111-02.R01 | run axe task on the fixture app with a missing label and a 2.9:1 chip | I18N_A11Y_AXE_VIOLATION reported with route, state, theme and selector; exit code 1 |
| TEST-PS-111-09.T02 | integration | PS-111-01.R02, PS-111-02.R02 | add a route without tests; remove one state test | I18N_A11Y_ROUTE_UNCOVERED naming route and state |
| TEST-PS-111-09.T03 | unit | PS-111-01.R03, PS-111-02.R03 | token pairs at 4.49:1, 4.5:1, 2.99:1 and 3:1 in all themes including semi-transparent tokens | failures below thresholds only; blended backgrounds evaluated |
| TEST-PS-111-09.T04 | unit | PS-111-01.R03, PS-111-02.R03, PS-111-03.R03 | waivers with 91 days, missing owner, expired, valid | I18N_A11Y_WAIVER_INVALID for the first three; valid waiver suppresses only its rule and route; 14-day warning emitted |
| TEST-PS-111-09.T05 | integration | PS-111-03.R01, PS-111-03.R02, PS-111-01.R02 | create a release candidate with an incomplete checklist | tagging blocked with I18N_A11Y_CHECKLIST_INCOMPLETE until all criteria have result, date, device, owner |
| TEST-PS-111-09.T06 | e2e | PS-111-02.R03, PS-111-01.R01 | pseudolocale ar-XB at 320 px and text-spacing override on all routes | no horizontal scroll or clipping (V06); axe passes in RTL |
| TEST-PS-111-09.T07 | integration | PS-111-04.R01, PS-111-04.R02, PS-111-04.R03 | run each CLI task and inspect outputs | exit codes, machine-readable report schema and stable error codes present; no app commands or events |
| TEST-PS-111-09.T08 | abuse | PS-111-05.R01, PS-111-05.R02, PS-111-05.R03, PS-111-07.R01, PS-111-07.R03 | PR that edits waivers.yaml or disables an axe rule with one reviewer | CI requires two CODEOWNERS approvals; rule disabling in config rejected |
| TEST-PS-111-09.T09 | chaos | PS-111-06.R01, PS-111-06.R02, PS-111-06.R03 | kill one Playwright shard; inject a flaky navigation timeout | run marked failed listing missing combinations; flaky retry reported, real findings not hidden |
| TEST-PS-111-09.T10 | unit | PS-111-06.R01, PS-111-07.R01, PS-111-07.R02 | run twice on the same commit; scan report for page text or user data | identical findings; reports contain selectors and rule ids only |
| TEST-PS-111-09.T11 | manual | PS-111-01.R02, PS-111-09.R03 | release pass on Pixel 7 and iPhone 14 for 2.4.11, 2.5.7, 2.5.8, 3.3.7, 3.3.8, 3.2.6, 1.4.10, 1.4.12 | each criterion recorded pass with owner, date, device; 3.3.8 confirms no cognitive function test |
| TEST-PS-111-09.T12 | load | PS-111-08.R01, PS-111-08.R02, PS-111-08.R03 | full suite on the CI runner | axe ≤ 15 min, contrast ≤ 10 s, trend artifact published |
| TEST-PS-111-09.T13 | unit | PS-111-09.R01, PS-111-09.R02 | traceability tool run | every PS-111 requirement maps to a passing test or recorded manual pass |
| TEST-PS-111-09.T14 | integration | PS-111-10.R01, PS-111-10.R02, PS-111-10.R03 | generate accessibility statement draft; upgrade axe-core minor version | draft lists results and waivers; new findings from the upgrade listed before the pin changes |

## Acceptance criteria

- All tests T01–T14 pass in CI and the manual checklist for the release is complete.
- Zero serious or critical axe violations across all routes, states, themes and viewports.
- Every colour token pair meets the contrast thresholds in all themes.

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
