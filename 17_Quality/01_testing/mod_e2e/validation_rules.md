# PS-134-02 — Validation rules: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-02.R01** Each e2e test title starts with a valid TEST-PS-NNN-PP.Tnn ID per CTR-TST-001.
- **PS-134-02.R02** A test fails if axe reports any violation with impact serious or critical on a visited screen, or any console error not on an allow list.
- **PS-134-02.R03** Playwright config validation rejects a run when the Chromium path is missing, versions differ from the pinned 1.63.0 or when fewer than the two device projects are configured.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Playwright version is 1.63.0 and exactly the two device projects Pixel 7 and iPhone 14 are configured | QUALITY_E2E_CONFIG_INVALID |
| V02 | Chromium executable resolves from the preinstalled path and PWA_DIST exists | QUALITY_E2E_ENV_MISSING |
| V03 | Axe reports zero violations with impact serious or critical on every visited screen | QUALITY_E2E_A11Y_VIOLATION |
| V04 | No console error or unhandled rejection outside the allow list | QUALITY_E2E_CONSOLE_ERROR |
| V05 | OBS-5 budgets hold: LCP 2.5 s, CLS 0.1, initial JS 150 KiB gzip | QUALITY_E2E_BUDGET_EXCEEDED |
| V06 | No-relay profile completes the offline journey with zero network requests and no error screen | QUALITY_E2E_RELAY_REQUIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T03 | unit | PS-134-02.R01, PS-134-02.R03 | validate Playwright config with wrong version, one project, missing Chromium path | QUALITY_E2E_CONFIG_INVALID or QUALITY_E2E_ENV_MISSING and exit 3 |
| TEST-PS-134-09.T04 | a11y | PS-134-02.R02, PS-134-09.R02 | visit a screen with an unlabeled input | QUALITY_E2E_A11Y_VIOLATION with the selector and exit 2 |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
