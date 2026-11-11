# PS-134-02 — Validation rules: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-02.R01** Each e2e test title starts with a valid TEST-PS-NNN-PP.Tnn ID per CTR-TST-001.
- **PS-134-02.R02** A test fails if axe reports any violation with impact serious or critical on a visited screen, or any console error not on an allow list.
- **PS-134-02.R03** Playwright config validation rejects a run when the Chromium path is missing, versions differ from the pinned 1.63.0 or when fewer than the two device projects are configured.
- **PS-134-02.R04** Identity screens meet CTR-UX-001 UX-5: vault unlock uses autocomplete current-password, new passphrase uses autocomplete new-password, paste and password managers are never blocked, a show/hide toggle exists, and a recovery kit can be imported by file; no screen shows sign-up, sign-in, log-in or account wording (N20).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Playwright version is 1.63.0 and exactly the two device projects Pixel 7 and iPhone 14 are configured | QUALITY_E2E_CONFIG_INVALID |
| V02 | Chromium executable resolves from the preinstalled path and PWA_DIST exists | QUALITY_E2E_ENV_MISSING |
| V03 | Axe reports zero violations with impact serious or critical on every visited screen | QUALITY_E2E_A11Y_VIOLATION |
| V04 | No console error or unhandled rejection outside the allow list | QUALITY_E2E_CONSOLE_ERROR |
| V05 | OBS-5 budgets hold: LCP 2.5 s, INP 200 ms over the scripted interaction (open a listing, tap Make offer), CLS 0.1, initial JS 150 KiB gzip | QUALITY_E2E_BUDGET_EXCEEDED |
| V06 | No-relay profile completes the offline journey with zero network requests and no error screen | QUALITY_E2E_RELAY_REQUIRED |
| V07 | The production relay build exposes no test-only route or hook (clock, seed); a probe gets 404 and the bundle scan finds none | QUALITY_E2E_TEST_ENDPOINT_IN_PROD |
| V08 | Identity screens meet UX-5 (autocomplete current-password and new-password, paste allowed, show/hide toggle, recovery kit import by file) and no screen shows sign-up, sign-in, log-in or account wording | QUALITY_E2E_AUTH_UX_INVALID |
| V09 | No test needed a retry in more than 3 of the last 20 CI runs, counted per test from the stored history artifact reports/e2e-history.json | QUALITY_E2E_FLAKY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T03 | unit | PS-134-02.R01, PS-134-02.R03 | validate Playwright config with wrong version, one project, missing Chromium path | QUALITY_E2E_CONFIG_INVALID or QUALITY_E2E_ENV_MISSING and exit 3 |
| TEST-PS-134-09.T04 | a11y | PS-134-02.R02, PS-134-09.R02 | visit a screen with an unlabeled input | QUALITY_E2E_A11Y_VIOLATION with the selector and exit 2 |
| TEST-PS-134-09.T19 | a11y | PS-134-02.R04 | create identity, set a new passphrase, lock and unlock, restore from a recovery kit file, then scan every visited screen for wording | autocomplete new-password and current-password present, paste allowed, show/hide toggle works, kit import by file works; no sign-up, sign-in, log-in or account wording; a planted paste block fails with QUALITY_E2E_AUTH_UX_INVALID |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
