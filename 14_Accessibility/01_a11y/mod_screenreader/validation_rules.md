# PS-110-02 — Validation rules: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-02.R01** Lint and unit checks reject markup that breaks screen reader structure.
- **PS-110-02.R02** Each failure has one stable code printed in CI and in the development overlay.
- **PS-110-02.R03** Rules run on every pull request and waivers require an expiring entry in tests/a11y/waivers.yaml (F14.S01.M03).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each page has exactly one main landmark and one h1, headings do not skip levels, and repeated landmark types have unique accessible names | I18N_A11Y_LANDMARKS |
| V02 | every form control has an accessible name and errors are linked by aria-describedby with aria-invalid set | I18N_A11Y_FORM_LABEL |
| V03 | icon-only buttons and links have an accessible name from visible text or aria-label | I18N_A11Y_NAME_MISSING |
| V04 | user photos have alt text of 1 to 140 characters or are marked decorative by the author | I18N_A11Y_ALT_TEXT |
| V05 | status changes use the announcer, assertive is used only for blocking errors, and no region announces more than once per 2 s | I18N_A11Y_LIVE_REGION |
| V06 | Money, distance and time values rendered visually have a matching spoken name from the helpers | I18N_A11Y_SPOKEN_VALUE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T01 | unit | PS-110-01.R01, PS-110-02.R01 | lint fixtures with 2 main landmarks, skipped heading, duplicate nav names | V01 raised; compliant page passes |
| TEST-PS-110-09.T02 | unit | PS-110-01.R02, PS-110-02.R02, PS-110-03.R01 | form fixtures without labels or error associations; submit with 3 errors | V02 raised; compliant form focuses the first invalid field and announces 3 errors |
| TEST-PS-110-09.T03 | unit | PS-110-02.R03, PS-110-05.R03, PS-110-07.R02 | icon-only button without name; photo without alt; alt of 141 characters; decorative photo | V03 and V04 raised; decorative accepted; no tracking links rendered |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-06.R01 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
